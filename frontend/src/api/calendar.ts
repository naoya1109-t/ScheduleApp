import { apiFetch } from "./client"

export type EventVisibility = "self" | "all"
export type RecurrenceRule = "none" | "daily" | "weekly" | "monthly"

export interface VisibleOccurrence {
  eventId: number
  ownerId: number
  startAt: string
  endAt: string
  isOwnEvent: boolean
  isBusyOnly: boolean
  title: string | null
}

export interface CreateEventInput {
  title: string
  startAt: string
  endAt: string
  visibility: EventVisibility
  isHidden: boolean
  isRecurring: boolean
  recurrenceRule: RecurrenceRule
}

export function listEvents(ownerId: number, from: string, to: string): Promise<VisibleOccurrence[]> {
  const params = new URLSearchParams({ ownerId: String(ownerId), from, to })
  return apiFetch<VisibleOccurrence[]>(`/api/calendar/events?${params.toString()}`)
}

export function createEvent(input: CreateEventInput) {
  return apiFetch("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteEvent(eventId: number) {
  return apiFetch<void>(`/api/calendar/events/${eventId}`, { method: "DELETE" })
}
