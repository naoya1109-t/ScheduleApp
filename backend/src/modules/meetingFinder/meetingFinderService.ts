import type { CalendarService } from "../calendar/calendarService.js"
import type { HolidayService } from "../holidays/holidayService.js"
import type { MeetingCandidate, MeetingSearchInput } from "./types.js"

// 要件3-10章で確定した固定パラメータ
const BUSINESS_START = { hour: 9, minute: 0 }
const BUSINESS_END = { hour: 17, minute: 30 }
const SLOT_STEP_MINUTES = 30
const MAX_CANDIDATES = 3

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export class MeetingFinderService {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly holidayService: HolidayService,
  ) {}

  async findCandidates(input: MeetingSearchInput): Promise<MeetingCandidate[]> {
    const rangeFrom = new Date(input.from)
    const rangeTo = new Date(input.to)

    const [holidays, companyHolidays, busyByUser] = await Promise.all([
      this.holidayService.listInRange(toDateKey(rangeFrom), toDateKey(rangeTo)),
      this.calendarService.listCompanyHolidays(rangeFrom.toISOString(), rangeTo.toISOString()),
      Promise.all(
        input.userIds.map((userId) =>
          this.calendarService.listBusyIntervals(userId, rangeFrom.toISOString(), rangeTo.toISOString()),
        ),
      ),
    ])

    const excludedDates = new Set<string>([
      ...holidays.map((holiday) => toDateKey(new Date(holiday.holidayDate))),
      ...companyHolidays.map((holiday) => toDateKey(new Date(holiday.startAt))),
    ])
    const busyIntervals = busyByUser.flat()

    const candidates: MeetingCandidate[] = []
    const cursor = startOfDay(rangeFrom)
    const lastDay = startOfDay(rangeTo)

    while (cursor <= lastDay && candidates.length < MAX_CANDIDATES) {
      const dayOfWeek = cursor.getDay() // 0=日, 6=土
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isHoliday = excludedDates.has(toDateKey(cursor))

      if (!isWeekend && !isHoliday) {
        let slotStart = new Date(cursor)
        slotStart.setHours(BUSINESS_START.hour, BUSINESS_START.minute, 0, 0)
        const dayEnd = new Date(cursor)
        dayEnd.setHours(BUSINESS_END.hour, BUSINESS_END.minute, 0, 0)

        while (candidates.length < MAX_CANDIDATES) {
          const slotEnd = new Date(slotStart.getTime() + input.durationMinutes * 60_000)
          if (slotEnd > dayEnd) break

          const overlaps = busyIntervals.some(
            (interval) => slotStart < interval.endAt && slotEnd > interval.startAt,
          )
          if (!overlaps) {
            candidates.push({ startAt: slotStart.toISOString(), endAt: slotEnd.toISOString() })
          }
          slotStart = new Date(slotStart.getTime() + SLOT_STEP_MINUTES * 60_000)
        }
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    return candidates
  }
}
