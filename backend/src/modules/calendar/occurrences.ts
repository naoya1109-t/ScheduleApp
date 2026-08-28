import type { CalendarEvent } from "./types.js"

const MAX_OCCURRENCES = 366

// 繰り返し予定は daily/weekly/monthly の単純な間隔指定のみサポートする(RFC5545 RRULE相当の
// 複雑な繰り返しパターン・例外日は対象外。要件上は「繰り返し予定」に対応できれば十分なため)
export function expandOccurrences(
  event: CalendarEvent,
  rangeFrom: Date,
  rangeTo: Date,
): Array<{ startAt: Date; endAt: Date }> {
  const originalStart = new Date(event.startAt)
  const originalEnd = new Date(event.endAt)
  const durationMs = originalEnd.getTime() - originalStart.getTime()

  if (!event.isRecurring || event.recurrenceRule === "none") {
    return originalStart <= rangeTo && originalEnd >= rangeFrom
      ? [{ startAt: originalStart, endAt: originalEnd }]
      : []
  }

  const occurrences: Array<{ startAt: Date; endAt: Date }> = []
  let cursor = new Date(originalStart)

  for (let i = 0; i < MAX_OCCURRENCES && cursor <= rangeTo; i++) {
    const occurrenceEnd = new Date(cursor.getTime() + durationMs)
    if (occurrenceEnd >= rangeFrom) {
      occurrences.push({ startAt: new Date(cursor), endAt: occurrenceEnd })
    }
    cursor = advance(cursor, event.recurrenceRule)
  }

  return occurrences
}

function advance(date: Date, rule: CalendarEvent["recurrenceRule"]): Date {
  const next = new Date(date)
  if (rule === "daily") {
    next.setDate(next.getDate() + 1)
  } else if (rule === "weekly") {
    next.setDate(next.getDate() + 7)
  } else if (rule === "monthly") {
    next.setMonth(next.getMonth() + 1)
  } else {
    // "none"はここに来ない想定だが、無限ループ防止のため必ず前進させる
    next.setDate(next.getDate() + 1)
  }
  return next
}
