import type { ConnectionPool } from "mssql"
import type {
  CalendarEvent,
  CalendarEventType,
  CreateEventInput,
  EventRepository,
  EventVisibility,
  RecurrenceRule,
  UpdateEventInput,
} from "./types.js"

interface EventRow {
  event_id: number
  owner_id: number
  title: string
  start_at: string
  end_at: string
  visibility: EventVisibility
  is_hidden: boolean
  is_recurring: boolean
  recurrence_rule: string | null
  event_type: CalendarEventType
}

function toEvent(row: EventRow): CalendarEvent {
  return {
    eventId: row.event_id,
    ownerId: row.owner_id,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    visibility: row.visibility,
    isHidden: row.is_hidden,
    isRecurring: row.is_recurring,
    recurrenceRule: (row.recurrence_rule ?? "none") as RecurrenceRule,
    eventType: row.event_type,
  }
}

export class MssqlEventRepository implements EventRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listByOwnerAndRange(ownerId: number, from: string, to: string): Promise<CalendarEvent[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("ownerId", ownerId)
      .input("from", from)
      .input("to", to).query<EventRow>(`
        SELECT * FROM calendar_event
        WHERE owner_id = @ownerId
          AND (
            is_recurring = 1
            OR (start_at <= @to AND end_at >= @from)
          )
      `)
    return result.recordset.map(toEvent)
  }

  async listCompanyHolidaysInRange(from: string, to: string): Promise<CalendarEvent[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("from", from)
      .input("to", to).query<EventRow>(`
        SELECT * FROM calendar_event
        WHERE event_type = 'company_holiday'
          AND start_at <= @to AND end_at >= @from
      `)
    return result.recordset.map(toEvent)
  }

  async findById(eventId: number): Promise<CalendarEvent | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("eventId", eventId)
      .query<EventRow>("SELECT * FROM calendar_event WHERE event_id = @eventId")
    const row = result.recordset[0]
    return row ? toEvent(row) : undefined
  }

  async create(input: CreateEventInput & { eventType: CalendarEventType }): Promise<CalendarEvent> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("ownerId", input.ownerId)
      .input("title", input.title)
      .input("startAt", input.startAt)
      .input("endAt", input.endAt)
      .input("visibility", input.visibility)
      .input("isHidden", input.isHidden)
      .input("isRecurring", input.isRecurring)
      .input("recurrenceRule", input.isRecurring ? input.recurrenceRule : null)
      .input("eventType", input.eventType).query<{ event_id: number }>(`
        INSERT INTO calendar_event (owner_id, title, start_at, end_at, visibility, is_hidden, is_recurring, recurrence_rule, event_type)
        OUTPUT inserted.event_id
        VALUES (@ownerId, @title, @startAt, @endAt, @visibility, @isHidden, @isRecurring, @recurrenceRule, @eventType)
      `)
    const created = await this.findById(result.recordset[0].event_id)
    if (!created) {
      throw new Error("予定の作成に失敗しました")
    }
    return created
  }

  async update(eventId: number, input: UpdateEventInput): Promise<CalendarEvent> {
    const pool = await this.getPool()
    const request = pool.request().input("eventId", eventId)
    const assignments: string[] = []
    if (input.title !== undefined) {
      request.input("title", input.title)
      assignments.push("title = @title")
    }
    if (input.startAt !== undefined) {
      request.input("startAt", input.startAt)
      assignments.push("start_at = @startAt")
    }
    if (input.endAt !== undefined) {
      request.input("endAt", input.endAt)
      assignments.push("end_at = @endAt")
    }
    if (input.visibility !== undefined) {
      request.input("visibility", input.visibility)
      assignments.push("visibility = @visibility")
    }
    if (input.isHidden !== undefined) {
      request.input("isHidden", input.isHidden)
      assignments.push("is_hidden = @isHidden")
    }
    if (input.isRecurring !== undefined) {
      request.input("isRecurring", input.isRecurring)
      assignments.push("is_recurring = @isRecurring")
    }
    if (input.recurrenceRule !== undefined) {
      request.input("recurrenceRule", input.recurrenceRule)
      assignments.push("recurrence_rule = @recurrenceRule")
    }
    if (assignments.length > 0) {
      await request.query(`UPDATE calendar_event SET ${assignments.join(", ")} WHERE event_id = @eventId`)
    }
    const updated = await this.findById(eventId)
    if (!updated) {
      throw new Error("予定が見つかりません")
    }
    return updated
  }

  async delete(eventId: number): Promise<void> {
    const pool = await this.getPool()
    await pool.request().input("eventId", eventId).query("DELETE FROM calendar_event WHERE event_id = @eventId")
  }
}
