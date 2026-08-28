import type {
  CalendarEvent,
  CalendarEventType,
  CreateEventInput,
  EventRepository,
  UpdateEventInput,
} from "../src/modules/calendar/types.js"

export class FakeEventRepository implements EventRepository {
  events: CalendarEvent[] = []
  private nextId = 1

  async listByOwnerAndRange(ownerId: number, _from: string, _to: string): Promise<CalendarEvent[]> {
    return this.events.filter((event) => event.ownerId === ownerId)
  }

  async listCompanyHolidaysInRange(_from: string, _to: string): Promise<CalendarEvent[]> {
    return this.events.filter((event) => event.eventType === "company_holiday")
  }

  async findById(eventId: number): Promise<CalendarEvent | undefined> {
    return this.events.find((event) => event.eventId === eventId)
  }

  async create(input: CreateEventInput & { eventType: CalendarEventType }): Promise<CalendarEvent> {
    const event: CalendarEvent = { ...input, eventId: this.nextId++ }
    this.events.push(event)
    return event
  }

  async update(eventId: number, input: UpdateEventInput): Promise<CalendarEvent> {
    const event = this.events.find((candidate) => candidate.eventId === eventId)
    if (!event) {
      throw new Error("予定が見つかりません")
    }
    Object.assign(event, input)
    return event
  }

  async delete(eventId: number): Promise<void> {
    this.events = this.events.filter((event) => event.eventId !== eventId)
  }
}
