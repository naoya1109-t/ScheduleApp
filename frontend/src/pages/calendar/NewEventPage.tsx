import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { createEvent, type EventVisibility, type RecurrenceRule } from "../../api/calendar"
import { ApiError } from "../../api/client"
import { listGroupMembers, listMyGroups } from "../../api/groups"
import { createReservation, listRooms, type MeetingRoom } from "../../api/rooms"
import { UserPickerModal, type GroupedMembers } from "../../components/UserPickerModal"
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
  const [groupedMembers, setGroupedMembers] = useState<GroupedMembers[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
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
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])

  const finalTargetIds = (() => {
    const set = new Set(selectedUserIds)
    for (const groupId of selectedGroupIds) {
      const group = groupedMembers.find((g) => g.group.groupId === groupId)
      if (group) {
        for (const member of group.members) set.add(member.userId)
      }
    }
    return Array.from(set)
  })()

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
        setGroupedMembers(
          groups.map((group, index) => ({
            group,
            members: memberLists[index].filter((member) => member.userId !== user.userId),
          })),
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [user])

  function getUserName(userId: number): string {
    if (userId === user?.userId) return `自分(${user.name})`
    for (const { members } of groupedMembers) {
      const found = members.find((member) => member.userId === userId)
      if (found) return found.name
    }
    return "利用者"
  }

  function toggleUser(userId: number) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  function toggleGroupSelection(groupId: number) {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      }
      // グループ選択時は個別選択されていたそのグループのメンバーをまとめて外し、グループ側の選択に一本化する
      const group = groupedMembers.find((g) => g.group.groupId === groupId)
      if (group) {
        const memberIds = new Set(group.members.map((member) => member.userId))
        setSelectedUserIds((users) => users.filter((id) => !memberIds.has(id)))
      }
      return [...prev, groupId]
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (form.roomId) {
      setSubmitting(true)
      try {
        const roomId = Number(form.roomId)
        const room = rooms.find((r) => r.roomId === roomId)
        await createReservation({
          roomId,
          title: form.title,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        })
        // 予約者本人の予定は会議室予約に連動して自動登録されるため、それ以外に選択されている参加者の予定を個別に登録する
        const attendeeIds = finalTargetIds.filter((id) => id !== user?.userId)
        for (const ownerId of attendeeIds) {
          await createEvent({
            title: room ? `[${room.name}] ${form.title}` : form.title,
            startAt: new Date(form.startAt).toISOString(),
            endAt: new Date(form.endAt).toISOString(),
            visibility: "all",
            isHidden: false,
            isRecurring: false,
            recurrenceRule: "none",
            ownerId,
          })
        }
        navigate("/calendar")
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "予定の登録に失敗しました")
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (finalTargetIds.length === 0) {
      setError("登録先の利用者を1人以上選択してください")
      return
    }

    setSubmitting(true)
    try {
      for (const ownerId of finalTargetIds) {
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

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">
            登録先の利用者(複数選択可)
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3">
            {selectedGroupIds.map((groupId) => (
                <span
                  key={`group-${groupId}`}
                  className="flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-[12px] font-bold text-teal"
                >
                  {groupedMembers.find((g) => g.group.groupId === groupId)?.group.name ?? "グループ"}(グループ全体)
                  <button
                    type="button"
                    onClick={() => toggleGroupSelection(groupId)}
                    className="text-teal/70 hover:text-teal"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {selectedUserIds.map((userId) => (
                <span
                  key={userId}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-soft px-2.5 py-1 text-[12px] font-bold text-indigo"
                >
                  {getUserName(userId)}
                  <button
                    type="button"
                    onClick={() => toggleUser(userId)}
                    className="text-indigo/70 hover:text-indigo"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {finalTargetIds.length === 0 && (
                <span className="text-[12px] text-text-soft">利用者が選択されていません</span>
              )}
              {user && !selectedUserIds.includes(user.userId) && (
                <button
                  type="button"
                  onClick={() => toggleUser(user.userId)}
                  className="rounded-full border border-dashed border-border px-2.5 py-1 text-[12px] font-bold text-text-soft hover:border-indigo hover:text-indigo"
                >
                  + 自分を追加
                </button>
              )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-[12px] font-bold text-text-soft hover:border-indigo hover:text-indigo"
            >
              + 利用者を追加
            </button>
          </div>
        </div>

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
              会議室を選択すると、自分の分は会議室予約として登録され、他に選択した利用者にも同じ内容が予定として登録されます(公開対象「全員」・非表示なし・繰り返しなし)。
            </p>
          )}
        </div>

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

      {pickerOpen && (
        <UserPickerModal
          groupedMembers={groupedMembers}
          selectedUserIds={selectedUserIds}
          selectedGroupIds={selectedGroupIds}
          onToggleUser={toggleUser}
          onToggleGroupSelection={toggleGroupSelection}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
