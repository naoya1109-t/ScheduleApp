import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { listEvents, type VisibleOccurrence } from "../../api/calendar"

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + i)
    return day
  })
}

export function MonthViewPage() {
  const { userId } = useParams<{ userId: string }>()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [occurrences, setOccurrences] = useState<VisibleOccurrence[]>([])

  const grid = buildMonthGrid(year, month)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const from = grid[0].toISOString()
    const to = grid[41].toISOString()
    listEvents(Number(userId), from, to)
      .then((data) => {
        if (!cancelled) setOccurrences(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, month])

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <div className="mx-auto max-w-[900px] p-8">
      <Link to="/" className="mb-4 inline-block text-[12.5px] font-bold text-text-soft">
        ← トップに戻る
      </Link>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">
          月表示 ({year}年{month + 1}月)
        </h1>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-border px-3 py-1.5 text-[12px] font-semibold"
            onClick={() => changeMonth(-1)}
          >
            前月
          </button>
          <button
            className="rounded-md border border-indigo px-3 py-1.5 text-[12px] font-bold text-indigo"
            onClick={() => {
              setYear(today.getFullYear())
              setMonth(today.getMonth())
            }}
          >
            今月
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5 text-[12px] font-semibold"
            onClick={() => changeMonth(1)}
          >
            翌月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-surface-alt p-2 text-center text-[11px] font-bold text-text-soft">
            {label}
          </div>
        ))}
        {grid.map((day) => {
          const dayOccurrences = occurrences.filter((occurrence) => isSameDay(new Date(occurrence.startAt), day))
          const inMonth = day.getMonth() === month
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[90px] p-1.5 ${inMonth ? "bg-white" : "bg-surface-alt"} ${
                isSameDay(day, today) ? "ring-2 ring-inset ring-indigo" : ""
              }`}
            >
              <div className={`mb-1 text-[11px] font-bold ${inMonth ? "text-text" : "text-text-soft"}`}>
                {day.getDate()}
              </div>
              {dayOccurrences.map((occurrence) => (
                <div key={occurrence.eventId} className="mb-0.5 truncate text-[10.5px]">
                  {occurrence.isBusyOnly ? "予定あり" : occurrence.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
