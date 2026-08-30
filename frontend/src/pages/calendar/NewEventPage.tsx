import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { createEvent, type EventVisibility, type RecurrenceRule } from "../../api/calendar"
import { ApiError } from "../../api/client"
import { listGroupMembers, listMyGroups } from "../../api/groups"
import { createReservation, listRooms, type MeetingRoom } from "../../api/rooms"
import { useAuth } from "../../context/AuthContext"

const emptyForm = {
  title: "",
  startAt: "",
  endAt: "",
  visibility: "all" as EventVisibility,
  isHidden: false,
  isRecurring: false,
  recurrenceRule: "weekly" as RecurrenceRule,
  roomId: "",
}

export function NewEventPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get("date")
  const ownerIdParam = searchParams.get("ownerId")

  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [colleagues, setColleagues] = useState<{ userId: number; name: string }[]>([])
  const [form, setForm] = useState(() =>
    dateParam ? { ...emptyForm, startAt: `${dateParam}T09:00`, endAt: `${dateParam}T10:00` } : emptyForm,
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(() => {
    if (ownerIdParam && user && Number(ownerIdParam) !== user.userId) {
      return [Number(ownerIdParam)]
    }
    return user ? [user.userId] : []
  })

  const isSelfOnly = selectedUserIds.length === 1 && selectedUserIds[0] === user?.userId

  useEffect(() => {
    listRooms().then(setRooms)
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    listMyGroups()
      .then(async (groups) => {
        const memberLists = await Promise.all(groups.map((group) => listGroupMembers(group.groupId)))
        if (cancelled) return
        const merged = new Map<number, string>()
        for (const members of memberLists) {
          for (const member of members) {
            if (member.userId !== user.userId) merged.set(member.userId, member.name)
          }
        }
        setColleagues(Array.from(merged, ([userId, name]) => ({ userId, name })))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [user])

  function toggleUser(userId: number) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (form.roomId) {
      setSubmitting(true)
      try {
        await createReservation({
          roomId: Number(form.roomId),
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        })
        navigate("/calendar")
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "予定の登録に失敗しました")
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (selectedUserIds.length === 0) {
      setError("登録先の利用者を1人以上選択してください")
      return
    }

    setSubmitting(true)
    try {
      for (const ownerId of selectedUserIds) {
        await createEvent({
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          visibility: form.visibility,
          isHidden: form.isHidden,
          isRecurring: form.isRecurring,
          recurrenceRule: form.recurrenceRule,
          ownerId,
        })
      }
      navigate("/calendar")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "予定の登録に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <Link to="/calendar" className="mb-2 inline-block text-[12px] text-text-soft">
        ← スケジュールに戻る
      </Link>
      <h1 className="mb-6 text-[18px] font-bold">予定の登録</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
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

        {!form.roomId && (
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">
              登録先の利用者(複数選択可)
            </label>
            <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
              {user && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.userId)}
                    onChange={() => toggleUser(user.userId)}
                  />
                  自分({user.name})
                </label>
              )}
              {colleagues.map((colleague) => (
                <label key={colleague.userId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(colleague.userId)}
                    onChange={() => toggleUser(colleague.userId)}
                  />
                  {colleague.name}
                </label>
              ))}
              {colleagues.length === 0 && (
                <p className="text-[12px] text-text-soft">同じグループの利用者がいません。</p>
              )}
            </div>
          </div>
        )}

        {isSelfOnly && (
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

        {!form.roomId && (
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
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>
    </div>
  )
}
