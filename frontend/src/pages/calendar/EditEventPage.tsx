import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { deleteEvent, getEvent, updateEvent, type EventVisibility, type RecurrenceRule } from "../../api/calendar"
import { ApiError } from "../../api/client"

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isCompanyHoliday, setIsCompanyHoliday] = useState(false)
  const [title, setTitle] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [visibility, setVisibility] = useState<EventVisibility>("all")
  const [isHidden, setIsHidden] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("weekly")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    getEvent(Number(eventId))
      .then((event) => {
        if (cancelled) return
        setTitle(event.title)
        setStartAt(toLocalInput(event.startAt))
        setEndAt(toLocalInput(event.endAt))
        setVisibility(event.visibility)
        setIsHidden(event.isHidden)
        setIsRecurring(event.isRecurring)
        setRecurrenceRule(event.recurrenceRule === "none" ? "weekly" : event.recurrenceRule)
        setIsCompanyHoliday(event.eventType === "company_holiday")
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "予定の取得に失敗しました")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!eventId) return
    setError(null)
    setSubmitting(true)
    try {
      if (isCompanyHoliday) {
        await updateEvent(Number(eventId), {
          title,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        })
      } else {
        await updateEvent(Number(eventId), {
          title,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          visibility,
          isHidden,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : "none",
        })
      }
      navigate("/calendar")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "予定の更新に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!eventId) return
    setError(null)
    try {
      await deleteEvent(Number(eventId))
      navigate("/calendar")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "予定の削除に失敗しました")
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-[600px] p-8 text-text-soft">読み込み中...</div>
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <Link to="/calendar" className="mb-2 inline-block text-[12px] text-text-soft">
        ← スケジュールに戻る
      </Link>
      <h1 className="mb-6 text-[18px] font-bold">予定の編集</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">タイトル</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">開始</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">終了</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
        </div>

        {isCompanyHoliday ? (
          <p className="text-[11px] text-text-soft">
            会社休日として登録されています(公開対象「全員」・非表示なし・繰り返しなしで固定)。
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-text-soft">公開対象</label>
              <select
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as EventVisibility)}
              >
                <option value="all">全員</option>
                <option value="self">自分</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
              非表示(「予定あり」とだけ見せる)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
              繰り返し
            </label>
            {isRecurring && (
              <select
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)}
              >
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
              </select>
            )}
          </div>
        )}

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "保存中..." : "保存する"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-coral px-4 py-2 text-sm font-bold text-coral"
          >
            削除
          </button>
        </div>
      </form>
    </div>
  )
}
