import { HttpError } from "../../middleware/httpError.js"
import { expandOccurrences } from "./occurrences.js"
import type {
  CalendarEvent,
  CreateEventInput,
  EventRepository,
  UpdateEventInput,
  VisibleOccurrence,
} from "./types.js"

export type CallerRole = "admin" | "general"

function assertCanModify(event: CalendarEvent, callerId: number, callerRole: CallerRole): void {
  const isOwner = event.ownerId === callerId
  const isAdminOverridingCompanyHoliday = event.eventType === "company_holiday" && callerRole === "admin"
  if (!isOwner && !isAdminOverridingCompanyHoliday) {
    throw new HttpError(403, "この予定を変更する権限がありません")
  }
}

export class CalendarService {
  constructor(private readonly repository: EventRepository) {}

  async createEvent(input: CreateEventInput) {
    if (input.eventType === "company_holiday") {
      // 会社休日は要件上「全員」向け・単発・通常表示で固定する(要件3-2)
      return this.repository.create({
        ...input,
        eventType: "company_holiday",
        visibility: "all",
        isHidden: false,
        isRecurring: false,
        recurrenceRule: "none",
      })
    }
    return this.repository.create({ ...input, eventType: "personal" })
  }

  async updateEvent(eventId: number, callerId: number, callerRole: CallerRole, input: UpdateEventInput) {
    const event = await this.repository.findById(eventId)
    if (!event) {
      throw new HttpError(404, "予定が見つかりません")
    }
    assertCanModify(event, callerId, callerRole)
    return this.repository.update(eventId, input)
  }

  async deleteEvent(eventId: number, callerId: number, callerRole: CallerRole) {
    const event = await this.repository.findById(eventId)
    if (!event) {
      throw new HttpError(404, "予定が見つかりません")
    }
    assertCanModify(event, callerId, callerRole)
    await this.repository.delete(eventId)
  }

  /**
   * ownerIdの予定を、viewerIdから見た公開対象・非表示ルールに従って取得する。
   * 公開対象「自分」は本人以外には表示されない。公開対象「全員」かつ非表示ONの
   * 予定は、本人以外には「予定あり」とだけ見える(タイトル等は伏せる)。
   */
  async listVisibleEvents(
    ownerId: number,
    viewerId: number,
    from: string,
    to: string,
  ): Promise<VisibleOccurrence[]> {
    const isSelf = ownerId === viewerId
    const events = await this.repository.listByOwnerAndRange(ownerId, from, to)
    const rangeFrom = new Date(from)
    const rangeTo = new Date(to)

    const result: VisibleOccurrence[] = []
    for (const event of events) {
      if (!isSelf && event.visibility === "self") {
        continue
      }
      const busyOnly = !isSelf && event.isHidden

      for (const occurrence of expandOccurrences(event, rangeFrom, rangeTo)) {
        result.push({
          eventId: event.eventId,
          ownerId: event.ownerId,
          startAt: occurrence.startAt.toISOString(),
          endAt: occurrence.endAt.toISOString(),
          isOwnEvent: isSelf,
          isBusyOnly: busyOnly,
          title: busyOnly ? null : event.title,
        })
      }
    }
    return result.sort((a, b) => a.startAt.localeCompare(b.startAt))
  }

  async listCompanyHolidays(from: string, to: string): Promise<VisibleOccurrence[]> {
    const events = await this.repository.listCompanyHolidaysInRange(from, to)
    return events.map((event) => ({
      eventId: event.eventId,
      ownerId: event.ownerId,
      startAt: event.startAt,
      endAt: event.endAt,
      isOwnEvent: false,
      isBusyOnly: false,
      title: event.title,
    }))
  }
}
