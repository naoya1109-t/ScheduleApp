export type EventVisibility = "self" | "all"
export type RecurrenceRule = "none" | "daily" | "weekly" | "monthly"
export type CalendarEventType = "personal" | "company_holiday"

export interface CalendarEvent {
  eventId: number
  ownerId: number
  title: string
  startAt: string
  endAt: string
  visibility: EventVisibility
  isHidden: boolean
  isRecurring: boolean
  recurrenceRule: RecurrenceRule
  eventType: CalendarEventType
}

export interface CreateEventInput {
  ownerId: number
  title: string
  startAt: string
  endAt: string
  visibility: EventVisibility
  isHidden: boolean
  isRecurring: boolean
  recurrenceRule: RecurrenceRule
  eventType?: CalendarEventType
}

export interface UpdateEventInput {
  title?: string
  startAt?: string
  endAt?: string
  visibility?: EventVisibility
  isHidden?: boolean
  isRecurring?: boolean
  recurrenceRule?: RecurrenceRule
}

// 他人の予定として見えている状態(公開対象/非表示ルール適用後)
export interface VisibleOccurrence {
  eventId: number
  ownerId: number
  startAt: string
  endAt: string
  isOwnEvent: boolean
  isBusyOnly: boolean
  title: string | null
}

export interface EventRepository {
  listByOwnerAndRange(ownerId: number, from: string, to: string): Promise<CalendarEvent[]>
  listCompanyHolidaysInRange(from: string, to: string): Promise<CalendarEvent[]>
  findById(eventId: number): Promise<CalendarEvent | undefined>
  create(input: CreateEventInput & { eventType: CalendarEventType }): Promise<CalendarEvent>
  update(eventId: number, input: UpdateEventInput): Promise<CalendarEvent>
  delete(eventId: number): Promise<void>
}
