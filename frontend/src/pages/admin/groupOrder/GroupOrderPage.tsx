import { useEffect, useState } from "react"
import { listGroupMembers, listGroups, updateGroupMemberOrder, type Group, type GroupMember } from "../../../api/groups"

export function GroupOrderPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    listGroups().then((data) => {
      if (cancelled) return
      setGroups(data)
      if (data.length > 0) setGroupId(data[0].groupId)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (groupId === null) return
    let cancelled = false
    listGroupMembers(groupId).then((data) => {
      if (!cancelled) setMembers(data)
    })
    return () => {
      cancelled = true
    }
  }, [groupId])

  function moveMember(index: number, direction: -1 | 1) {
    setMembers((prev) => {
      const next = [...prev]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  async function handleSave() {
    if (groupId === null) return
    const orders = members.map((member, index) => ({ userId: member.userId, displayOrder: index + 1 }))
    const updated = await updateGroupMemberOrder(groupId, orders)
    setMembers(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">グループメンバー表示順設定</h1>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-[11.5px] font-bold text-text-soft">グループ</label>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={groupId ?? ""}
          onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
        >
          {groups.map((group) => (
            <option key={group.groupId} value={group.groupId}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {members.map((member, index) => (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <span>
              {index + 1}. {member.name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => moveMember(index, -1)}
                disabled={index === 0}
                className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
              >
                ↑
              </button>
              <button
                onClick={() => moveMember(index, 1)}
                disabled={index === members.length - 1}
                className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="text-text-soft">メンバーがいません。</p>}
      </div>

      <button onClick={handleSave} className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
        {saved ? "保存しました" : "この順序で保存"}
      </button>
    </div>
  )
}
