import { describe, expect, it } from "vitest"
import { expandOccurrences } from "../src/modules/calendar/occurrences.js"
import type { CalendarEvent } from "../src/modules/calendar/types.js"

function baseEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    eventId: 1,
    ownerId: 1,
    title: "定例MTG",
    startAt: "2026-09-01T09:00:00.000Z",
    endAt: "2026-09-01T10:00:00.000Z",
    visibility: "all",
    isHidden: false,
    isRecurring: false,
    recurrenceRule: "none",
    eventType: "personal",
    ...overrides,
  }
}

describe("expandOccurrences", () => {
  it("非繰り返し予定は1件だけ返す", () => {
    const result = expandOccurrences(
      baseEvent(),
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-07T00:00:00.000Z"),
    )
    expect(result).toHaveLength(1)
  })

  it("範囲外の非繰り返し予定は返さない", () => {
    const result = expandOccurrences(
      baseEvent(),
      new Date("2026-10-01T00:00:00.000Z"),
      new Date("2026-10-07T00:00:00.000Z"),
    )
    expect(result).toHaveLength(0)
  })

  it("毎週繰り返しの予定は範囲内の全occurrenceを返す", () => {
    const event = baseEvent({ isRecurring: true, recurrenceRule: "weekly" })
    const result = expandOccurrences(
      event,
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-22T23:59:59.000Z"),
    )
    expect(result).toHaveLength(4)
    expect(result[1].startAt.toISOString()).toBe("2026-09-08T09:00:00.000Z")
  })

  it("毎日繰り返しの予定は日数分のoccurrenceを返す", () => {
    const event = baseEvent({ isRecurring: true, recurrenceRule: "daily" })
    const result = expandOccurrences(
      event,
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-03T23:59:59.000Z"),
    )
    expect(result).toHaveLength(3)
  })
})
