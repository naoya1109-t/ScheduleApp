import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../api/client"
import {
  createEvent,
  deleteEvent,
  listEvents,
  type EventVisibility,
  type RecurrenceRule,
  type VisibleOccurrence,
} from "../../api/calendar"
import { useAuth } from "../../context/AuthContext"

function startOfWeekRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(from)
  to.setDate(to.getDate() + 14)
  return { from: from.toISOString(), to: to.toISOString() }
}

const emptyForm = {
  title: "",
  startAt: "",
  endAt: "",
  visibility: "all" as EventVisibility,
  isHidden: false,
  isRecurring: false,
  recurrenceRule: "weekly" as RecurrenceRule,
}

export function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<VisibleOccurrence[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!user) return
    const { from, to } = startOfWeekRange()
    setEvents(await listEvents(user.userId, from, to))
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      const { from, to } = startOfWeekRange()
      const data = await listEvents(user.userId, from, to)
      if (!cancelled) setEvents(data)
    }
    load().catch(() => {
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
      await createEvent({
        title: form.title,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        visibility: form.visibility,
        isHidden: form.isHidden,
        isRecurring: form.isRecurring,
        recurrenceRule: form.recurrenceRule,
      })
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

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">個人予定(本日から2週間)</h1>

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
        {error && <p className="text-sm text-coral">{error}</p>}
        <button type="submit" className="rounded-md bg-indigo py-2 text-sm font-bold text-white">
          予定を登録
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {events.map((occurrence) => (
          <div
            key={`${occurrence.eventId}-${occurrence.startAt}`}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <div>
              <span className="font-bold">{occurrence.isBusyOnly ? "予定あり" : occurrence.title}</span>
              <span className="ml-3 text-text-soft">
                {new Date(occurrence.startAt).toLocaleString("ja-JP")} 〜{" "}
                {new Date(occurrence.endAt).toLocaleString("ja-JP")}
              </span>
            </div>
            {occurrence.isOwnEvent && (
              <button onClick={() => handleDelete(occurrence.eventId)} className="text-coral">
                削除
              </button>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="text-text-soft">予定はまだありません。</p>}
      </div>
    </div>
  )
}
