import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { VisibleOccurrence } from "../api/calendar"
import { listGroups, listMyGroups, type Group } from "../api/groups"
import { listHolidaysInRange, type Holiday } from "../api/holidays"
import { getWeekGantt, type WeekGanttRow } from "../api/topPage"
import { addDays, formatMd, isSameDay, startOfToday, toDateOnly, WEEKDAY_LABELS } from "../utils/dateUtils"
import { UserInfoModal } from "./UserInfoModal"

function occurrencesOnDay(occurrences: VisibleOccurrence[], day: Date): VisibleOccurrence[] {
  return occurrences.filter((occurrence) => isSameDay(new Date(occurrence.startAt), day))
}

export function WeeklySchedule() {
  const [anchor, setAnchor] = useState<Date>(startOfToday())
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | null>(null)
  const [rows, setRows] = useState<WeekGanttRow[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const today = startOfToday()
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i))

  function holidayOnDay(day: Date): Holiday | undefined {
    const dateOnly = toDateOnly(day)
    return holidays.find((holiday) => holiday.holidayDate === dateOnly)
  }

  useEffect(() => {
    let cancelled = false
    listMyGroups()
      .then((mine) => {
        if (cancelled) return
        if (mine.length > 0) {
          setGroups(mine)
          setGroupId(mine[0].groupId)
        } else {
          return listGroups().then((all) => {
            if (!cancelled) setGroups(all)
          })
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const from = days[0].toISOString()
    const to = addDays(days[6], 1).toISOString()
    getWeekGantt(groupId, from, to)
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, anchor])

  useEffect(() => {
    let cancelled = false
    listHolidaysInRange(toDateOnly(days[0]), toDateOnly(days[6]))
      .then((data) => {
        if (!cancelled) setHolidays(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor])

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-bold">
          {days[0].getFullYear()}/{formatMd(days[0])} 〜 {formatMd(days[6])}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
            onClick={() => setAnchor((prev) => addDays(prev, -7))}
          >
            前週
          </button>
          <button
            className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
            onClick={() => setAnchor((prev) => addDays(prev, -1))}
          >
            前日
          </button>
          <button
            className="rounded-md border border-indigo px-2.5 py-1 text-[11.5px] font-bold text-indigo"
            onClick={() => setAnchor(startOfToday())}
          >
            本日
          </button>
          <button
            className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
            onClick={() => setAnchor((prev) => addDays(prev, 1))}
          >
            翌日
          </button>
          <button
            className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
            onClick={() => setAnchor((prev) => addDays(prev, 7))}
          >
            翌週
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[132px_repeat(7,1fr)] border-l border-t border-border">
        <div className="flex flex-col gap-1 border-b border-r border-border bg-surface-alt p-1.5">
          <div className="text-[9px] font-medium text-text-soft">表示グループ</div>
          <select
            className="rounded-md border border-border bg-white px-2 py-1 text-[11.5px] font-bold"
            value={groupId ?? ""}
            onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">(自分のみ)</option>
            {groups.map((group) => (
              <option key={group.groupId} value={group.groupId}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        {days.map((day) => {
          const holiday = holidayOnDay(day)
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col items-center gap-0.5 border-b border-r border-border p-1.5 text-center text-[11px] font-semibold ${
                holiday
                  ? "bg-coral-soft text-coral"
                  : isSameDay(day, today)
                    ? "bg-indigo-soft text-indigo"
                    : "bg-surface-alt text-text-soft"
              }`}
            >
              <span>
                {WEEKDAY_LABELS[(day.getDay() + 6) % 7]} {formatMd(day)}
              </span>
              {holiday && (
                <span className="rounded bg-coral px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {holiday.name}
                </span>
              )}
              {!holiday && isSameDay(day, today) && (
                <span className="rounded bg-indigo px-1.5 py-0.5 text-[9px] font-bold text-white">本日</span>
              )}
            </div>
          )
        })}

        {rows.map((row) => (
          <Fragment key={row.userId}>
            <div className="flex flex-col gap-1.5 justify-center border-b border-r border-border p-2">
              <button
                onClick={() => setSelectedUserId(row.userId)}
                className="flex items-center gap-1.5 text-left text-[13px] font-bold text-text underline decoration-dotted underline-offset-2"
              >
                {row.isSelf && <span className="h-1.5 w-1.5 rounded-full bg-indigo" />}
                {row.name}
              </button>
              <Link
                to={`/calendar/month/${row.userId}`}
                className="w-fit rounded-md border border-border bg-surface-alt px-2 py-0.5 text-[10.5px] text-text-soft"
              >
                月表示
              </Link>
            </div>
            {days.map((day) => {
              const dayOccurrences = occurrencesOnDay(row.occurrences, day)
              const holiday = holidayOnDay(day)
              return (
                <div
                  key={`${row.userId}-${day.toISOString()}`}
                  className={`flex min-h-[54px] flex-col justify-center gap-1 border-b border-r border-border p-1.5 ${
                    holiday ? "bg-coral-soft" : isSameDay(day, today) ? "bg-indigo-soft" : "bg-white"
                  }`}
                >
                  {dayOccurrences.map((occurrence) =>
                    occurrence.isOwnEvent ? (
                      <Link
                        key={occurrence.eventId}
                        to={`/calendar/events/${occurrence.eventId}/edit`}
                        className="flex items-center gap-1.5 text-[11px] underline decoration-dotted underline-offset-2"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-indigo" />
                        {new Date(occurrence.startAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {occurrence.isBusyOnly ? "予定あり" : occurrence.title}
                      </Link>
                    ) : (
                      <div key={occurrence.eventId} className="flex items-center gap-1.5 text-[11px]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-indigo" />
                        {new Date(occurrence.startAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {occurrence.isBusyOnly ? "予定あり" : occurrence.title}
                      </div>
                    ),
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      {selectedUserId !== null && (
        <UserInfoModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}
