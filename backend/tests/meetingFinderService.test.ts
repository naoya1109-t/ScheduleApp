import { describe, expect, it } from "vitest"
import { CalendarService } from "../src/modules/calendar/calendarService.js"
import { HolidayService } from "../src/modules/holidays/holidayService.js"
import { MeetingFinderService } from "../src/modules/meetingFinder/meetingFinderService.js"
import { FakeEventRepository } from "./fakeEventRepository.js"
import { FakeHolidayRepository } from "./fakeHolidayRepository.js"
import { FakeJapaneseHolidaySource } from "./fakeJapaneseHolidaySource.js"

// 2026-08-31(月)を起点に検索する(ローカルタイムゾーン基準)。8/29-30・9/5-6は土日。
const SEARCH_FROM = new Date(2026, 7, 31).toISOString()
const SEARCH_TO = new Date(2026, 8, 11, 23, 59, 59).toISOString()

function localSlot(year: number, month: number, day: number, hour: number, minute: number): string {
  return new Date(year, month, day, hour, minute, 0, 0).toISOString()
}

function setup() {
  const eventRepository = new FakeEventRepository()
  const calendarService = new CalendarService(eventRepository)
  const holidayRepository = new FakeHolidayRepository()
  const holidayService = new HolidayService(holidayRepository, new FakeJapaneseHolidaySource())
  const service = new MeetingFinderService(calendarService, holidayService)
  return { eventRepository, calendarService, holidayService, holidayRepository, service }
}

describe("MeetingFinderService", () => {
  it("誰も予定が無ければ、初日の営業開始時刻(9:00)から候補が見つかる", async () => {
    const { service } = setup()
    const candidates = await service.findCandidates({
      userIds: [1, 2],
      durationMinutes: 60,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    expect(candidates).toHaveLength(3)
    expect(candidates[0].startAt).toBe(localSlot(2026, 7, 31, 9, 0))
    expect(candidates[0].endAt).toBe(localSlot(2026, 7, 31, 10, 0))
  })

  it("土日は候補から除外される", async () => {
    const { service } = setup()
    const candidates = await service.findCandidates({
      userIds: [1],
      durationMinutes: 30,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    const weekendCandidate = candidates.find((c) => {
      const day = new Date(c.startAt).getDay()
      return day === 0 || day === 6
    })
    expect(weekendCandidate).toBeUndefined()
  })

  it("祝日は候補から除外される", async () => {
    const { holidayRepository, service } = setup()
    await holidayRepository.create({ holidayDate: "2026-08-31", name: "テスト祝日", fiscalYear: 2026 })

    const candidates = await service.findCandidates({
      userIds: [1],
      durationMinutes: 30,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    expect(candidates.some((c) => new Date(c.startAt).getDate() === 31 && new Date(c.startAt).getMonth() === 7)).toBe(
      false,
    )
  })

  it("選択したメンバーの誰か1人でも予定があれば、その時間帯は候補から外れる", async () => {
    const { eventRepository, calendarService, service } = setup()
    await calendarService.createEvent({
      ownerId: 2,
      title: "先約",
      startAt: localSlot(2026, 7, 31, 9, 0),
      endAt: localSlot(2026, 7, 31, 10, 0),
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })
    expect(eventRepository.events).toHaveLength(1)

    const candidates = await service.findCandidates({
      userIds: [1, 2],
      durationMinutes: 60,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    expect(candidates[0].startAt).not.toBe(localSlot(2026, 7, 31, 9, 0))
  })

  it("非表示設定の予定も、内容に関わらずbusyとして扱われる", async () => {
    const { calendarService, service } = setup()
    await calendarService.createEvent({
      ownerId: 1,
      title: "内緒の予定",
      startAt: localSlot(2026, 7, 31, 9, 0),
      endAt: localSlot(2026, 7, 31, 10, 0),
      visibility: "self",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const candidates = await service.findCandidates({
      userIds: [1],
      durationMinutes: 60,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    expect(candidates[0].startAt).not.toBe(localSlot(2026, 7, 31, 9, 0))
  })

  it("営業時間(9:00-17:30)を超える候補は提示されない", async () => {
    const { service } = setup()
    const candidates = await service.findCandidates({
      userIds: [1],
      durationMinutes: 120,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    for (const candidate of candidates) {
      const end = new Date(candidate.endAt)
      const withinBusinessHours = end.getHours() < 17 || (end.getHours() === 17 && end.getMinutes() <= 30)
      expect(withinBusinessHours).toBe(true)
    }
  })

  it("候補提示件数は最大3件", async () => {
    const { service } = setup()
    const candidates = await service.findCandidates({
      userIds: [1],
      durationMinutes: 30,
      from: SEARCH_FROM,
      to: SEARCH_TO,
    })

    expect(candidates.length).toBeLessThanOrEqual(3)
  })
})
