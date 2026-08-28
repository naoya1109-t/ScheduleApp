import { HttpError } from "../../middleware/httpError.js"
import { expandOccurrences } from "./occurrences.js"
import type {
  CreateEventInput,
  EventRepository,
  UpdateEventInput,
  VisibleOccurrence,
} from "./types.js"

export class CalendarService {
  constructor(private readonly repository: EventRepository) {}

  async createEvent(input: CreateEventInput) {
    return this.repository.create(input)
  }

  async updateEvent(eventId: number, ownerId: number, input: UpdateEventInput) {
    const event = await this.repository.findById(eventId)
    if (!event || event.ownerId !== ownerId) {
      throw new HttpError(403, "この予定を編集する権限がありません")
    }
    return this.repository.update(eventId, input)
  }

  async deleteEvent(eventId: number, ownerId: number) {
    const event = await this.repository.findById(eventId)
    if (!event || event.ownerId !== ownerId) {
      throw new HttpError(403, "この予定を削除する権限がありません")
    }
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
}
