import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ApiError } from "../../../api/client"
import { addGroupMember, listGroupMembers, listGroups, removeGroupMember, type Group, type GroupMember } from "../../../api/groups"
import { listUserDirectory, type DirectoryUser } from "../../../api/userDirectory"

export function GroupMembersPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [directory, setDirectory] = useState<DirectoryUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return
    let cancelled = false
    const id = Number(groupId)
    Promise.all([listGroups(), listGroupMembers(id), listUserDirectory()]).then(
      ([groups, memberData, directoryData]) => {
        if (cancelled) return
        setGroup(groups.find((g) => g.groupId === id) ?? null)
        setMembers(memberData)
        setDirectory(directoryData)
      },
    )
    return () => {
      cancelled = true
    }
  }, [groupId])

  const memberIds = new Set(members.map((m) => m.userId))
  const candidates = directory.filter((u) => !memberIds.has(u.userId))

  async function handleAdd() {
    if (!groupId || !selectedUserId) return
    setError(null)
    try {
      const updated = await addGroupMember(Number(groupId), Number(selectedUserId))
      setMembers(updated)
      setSelectedUserId("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "メンバーの追加に失敗しました")
    }
  }

  async function handleRemove(userId: number) {
    if (!groupId) return
    setError(null)
    try {
      const updated = await removeGroupMember(Number(groupId), userId)
      setMembers(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "メンバーの削除に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <Link to="/admin/groups" className="mb-2 inline-block text-[12px] text-text-soft">
        ← グループ管理に戻る
      </Link>
      <h1 className="mb-6 text-[18px] font-bold">{group ? `${group.name} のメンバー管理` : "メンバー管理"}</h1>

      <div className="mb-6 flex items-end gap-3 rounded-[14px] border border-border bg-surface p-4">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-bold text-text-soft">追加する利用者</label>
          <select
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">選択してください</option>
            {candidates.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={!selectedUserId}
          className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          追加
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <span>{member.name}</span>
            <button onClick={() => handleRemove(member.userId)} className="text-coral">
              削除
            </button>
          </div>
        ))}
        {members.length === 0 && <p className="text-text-soft">メンバーはまだいません。</p>}
      </div>
    </div>
  )
}
