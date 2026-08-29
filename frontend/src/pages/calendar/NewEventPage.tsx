import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../../api/client"
import {
  createEvent,
  deleteEvent,
  listCompanyHolidays,
  listEvents,
  type EventVisibility,
  type RecurrenceRule,
  type VisibleOccurrence,
} from "../../api/calendar"
import { listHolidaysInRange, type Holiday } from "../../api/holidays"
import { createReservation, listRooms, type MeetingRoom } from "../../api/rooms"
import { useAuth } from "../../context/AuthContext"

function rangeIso(): { from: string; to: string; fromDate: string; toDate: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(from)
  to.setDate(to.getDate() + 14)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
  }
}

const emptyForm = {
  title: "",
  startAt: "",
  endAt: "",
  visibility: "all" as EventVisibility,
  isHidden: false,
  isRecurring: false,
  recurrenceRule: "weekly" as RecurrenceRule,
  isCompanyHoliday: false,
  roomId: "",
}

type TimelineItem =
  | { kind: "event"; key: string; sortKey: string; occurrence: VisibleOccurrence }
  | { kind: "holiday"; key: string; sortKey: string; label: string; name: string }

export function NewEventPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<VisibleOccurrence[]>([])
  const [companyHolidays, setCompanyHolidays] = useState<VisibleOccurrence[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRooms().then(setRooms)
  }, [])

  async function reload() {
    if (!user) return
    const { from, to, fromDate, toDate } = rangeIso()
    const [eventData, companyHolidayData, holidayData] = await Promise.all([
      listEvents(user.userId, from, to),
      listCompanyHolidays(from, to),
      listHolidaysInRange(fromDate, toDate),
    ])
    setEvents(eventData)
    setCompanyHolidays(companyHolidayData)
    setHolidays(holidayData)
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const { from, to, fromDate, toDate } = rangeIso()

    Promise.all([
      listEvents(user.userId, from, to),
      listCompanyHolidays(from, to),
      listHolidaysInRange(fromDate, toDate),
    ])
      .then(([eventData, companyHolidayData, holidayData]) => {
        if (cancelled) return
        setEvents(eventData)
        setCompanyHolidays(companyHolidayData)
        setHolidays(holidayData)
      })
      .catch(() => {
        if (!cancelled) setError("予定の取得に失敗しました")
      })

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (form.isCompanyHoliday) {
        await createEvent({
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          eventType: "company_holiday",
        })
      } else if (form.roomId) {
        await createReservation({
          roomId: Number(form.roomId),
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        })
      } else {
        await createEvent({
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          visibility: form.visibility,
          isHidden: form.isHidden,
          isRecurring: form.isRecurring,
          recurrenceRule: form.recurrenceRule,
        })
      }
      setForm(emptyForm)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "予定の登録に失敗しました")
    }
  }

  async function handleDelete(eventId: number) {
    await deleteEvent(eventId)
    await reload()
  }

  const timeline: TimelineItem[] = [
    ...holidays.map((holiday) => ({
      kind: "holiday" as const,
      key: `holiday-${holiday.holidayId}`,
      sortKey: `${holiday.holidayDate}T00:00:00.000Z`,
      label: "祝日",
      name: holiday.name,
    })),
    ...companyHolidays.map((occurrence) => ({
      kind: "holiday" as const,
      key: `company-${occurrence.eventId}`,
      sortKey: occurrence.startAt,
      label: "会社休日",
      name: occurrence.title ?? "",
    })),
    ...events.map((occurrence) => ({
      kind: "event" as const,
      key: `event-${occurrence.eventId}-${occurrence.startAt}`,
      sortKey: occurrence.startAt,
      occurrence,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <Link to="/calendar" className="mb-2 inline-block text-[12px] text-text-soft">
        ← スケジュールに戻る
      </Link>
      <h1 className="mb-6 text-[18px] font-bold">個人予定の登録(本日から2週間)</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">タイトル</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">開始</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">終了</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isCompanyHoliday}
            onChange={(e) => setForm({ ...form, isCompanyHoliday: e.target.checked })}
          />
          会社休日として登録する(公開対象「全員」で全社員に共有されます)
        </label>

        {!form.isCompanyHoliday && (
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">会議室(任意)</label>
            <select
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="">選択しない</option>
              {rooms.map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {room.name}
                </option>
              ))}
            </select>
            {form.roomId && (
              <p className="mt-1 text-[11px] text-text-soft">
                会議室を選択した場合、公開対象「全員」・非表示なし・繰り返しなしで登録されます。
              </p>
            )}
          </div>
        )}

        {!form.isCompanyHoliday && !form.roomId && (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-text-soft">公開対象</label>
              <select
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}
              >
                <option value="all">全員</option>
                <option value="self">自分</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isHidden}
                onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
              />
              非表示(「予定あり」とだけ見せる)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              />
              繰り返し
            </label>
            {form.isRecurring && (
              <select
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={form.recurrenceRule}
                onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value as RecurrenceRule })}
              >
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
              </select>
            )}
          </div>
        )}

        {error && <p className="text-sm text-coral">{error}</p>}
        <button type="submit" className="rounded-md bg-indigo py-2 text-sm font-bold text-white">
          登録
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {timeline.map((item) =>
          item.kind === "holiday" ? (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-md border border-coral-soft bg-coral-soft px-4 py-3 text-sm"
            >
              <span className="rounded bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.label}
              </span>
              <span className="font-bold">{item.name}</span>
            </div>
          ) : (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <div>
                <span className="font-bold">
                  {item.occurrence.isBusyOnly ? "予定あり" : item.occurrence.title}
                </span>
                <span className="ml-3 text-text-soft">
                  {new Date(item.occurrence.startAt).toLocaleString("ja-JP")} 〜{" "}
                  {new Date(item.occurrence.endAt).toLocaleString("ja-JP")}
                </span>
              </div>
              {item.occurrence.isOwnEvent && (
                <button onClick={() => handleDelete(item.occurrence.eventId)} className="text-coral">
                  削除
                </button>
              )}
            </div>
          ),
        )}
        {timeline.length === 0 && <p className="text-text-soft">予定はまだありません。</p>}
      </div>
    </div>
  )
}
