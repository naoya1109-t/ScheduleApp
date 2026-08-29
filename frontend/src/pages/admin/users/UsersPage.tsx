import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../../../api/client"
import {
  addGroupMember,
  listGroupMembers,
  listGroups,
  removeGroupMember,
  updateGroupMemberOrder,
  type Group,
  type GroupMember,
} from "../../../api/groups"
import { listJobTitles, type JobTitle } from "../../../api/jobTitles"
import { listUserDirectory, type DirectoryUser } from "../../../api/userDirectory"
import { reactivateUser, retireUser, listUsers, updateUser, type UserSummary } from "../../../api/users"

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")
  const [members, setMembers] = useState<GroupMember[]>([])
  const [directory, setDirectory] = useState<DirectoryUser[]>([])
  const [addUserId, setAddUserId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderSaved, setOrderSaved] = useState(false)

  async function reloadUsers() {
    setUsers(await listUsers())
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([listUsers(), listGroups(), listUserDirectory(), listJobTitles()])
      .then(([userData, groupData, directoryData, jobTitleData]) => {
        if (cancelled) return
        setUsers(userData)
        setGroups(groupData)
        setDirectory(directoryData)
        setJobTitles(jobTitleData)
      })
      .catch(() => {
        if (!cancelled) setError("利用者一覧の取得に失敗しました")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleChangeJobTitle(userId: number, jobTitleId: string) {
    setError(null)
    try {
      await updateUser(userId, { jobTitleId: jobTitleId ? Number(jobTitleId) : null })
      await reloadUsers()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "役職の更新に失敗しました")
    }
  }

  useEffect(() => {
    if (selectedGroupId === "all") return
    let cancelled = false
    listGroupMembers(Number(selectedGroupId)).then((data) => {
      if (!cancelled) setMembers(data)
    })
    return () => {
      cancelled = true
    }
  }, [selectedGroupId])

  async function handleRetire(userId: number) {
    await retireUser(userId)
    await reloadUsers()
  }

  async function handleReactivate(userId: number) {
    await reactivateUser(userId)
    await reloadUsers()
  }

  const memberIds = new Set(members.map((m) => m.userId))
  const candidates = directory.filter((u) => !memberIds.has(u.userId))

  async function handleAddMember() {
    if (selectedGroupId === "all" || !addUserId) return
    setError(null)
    try {
      const updated = await addGroupMember(Number(selectedGroupId), Number(addUserId))
      setMembers(updated)
      setAddUserId("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "メンバーの追加に失敗しました")
    }
  }

  async function handleRemoveMember(userId: number) {
    if (selectedGroupId === "all") return
    setError(null)
    try {
      const updated = await removeGroupMember(Number(selectedGroupId), userId)
      setMembers(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "メンバーの削除に失敗しました")
    }
  }

  function moveMember(index: number, direction: -1 | 1) {
    setMembers((prev) => {
      const next = [...prev]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  async function handleSaveOrder() {
    if (selectedGroupId === "all") return
    setError(null)
    try {
      const orders = members.map((member, index) => ({ userId: member.userId, displayOrder: index + 1 }))
      const updated = await updateGroupMemberOrder(Number(selectedGroupId), orders)
      setMembers(updated)
      setOrderSaved(true)
      setTimeout(() => setOrderSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "並び順の保存に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">利用者管理</h1>
        <Link to="/admin/users/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          + 新規登録
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-[11.5px] font-bold text-text-soft">グループ</label>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
        >
          <option value="all">全員</option>
          {groups.map((group) => (
            <option key={group.groupId} value={group.groupId}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      {selectedGroupId === "all" ? (
        loading ? (
          <p className="text-text-soft">読み込み中...</p>
        ) : (
          <table className="w-full overflow-hidden rounded-[14px] border border-border bg-surface text-sm">
            <thead className="bg-surface-alt text-left text-[11.5px] text-text-soft">
              <tr>
                <th className="px-4 py-2">氏名</th>
                <th className="px-4 py-2">ログインID</th>
                <th className="px-4 py-2">権限</th>
                <th className="px-4 py-2">役職</th>
                <th className="px-4 py-2">状態</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-t border-border">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.loginId}</td>
                  <td className="px-4 py-2">{u.role === "admin" ? "管理者" : "一般社員"}</td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded-md border border-border px-2 py-1 text-[12.5px]"
                      value={u.jobTitleId ?? ""}
                      onChange={(e) => handleChangeJobTitle(u.userId, e.target.value)}
                    >
                      <option value="">未設定</option>
                      {jobTitles.map((jobTitle) => (
                        <option key={jobTitle.jobTitleId} value={jobTitle.jobTitleId}>
                          {jobTitle.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">{u.status === "active" ? "在籍" : "退職済み"}</td>
                  <td className="px-4 py-2">
                    {u.status === "active" ? (
                      <button className="text-coral" onClick={() => handleRetire(u.userId)}>
                        退職処理
                      </button>
                    ) : (
                      <button className="text-teal" onClick={() => handleReactivate(u.userId)}>
                        復職
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <>
          <div className="mb-4 flex items-end gap-3 rounded-[14px] border border-border bg-surface p-4">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-bold text-text-soft">追加する利用者</label>
              <select
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
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
              onClick={handleAddMember}
              disabled={!addUserId}
              className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              追加
            </button>
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
                <div className="flex items-center gap-2">
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
                  <button onClick={() => handleRemoveMember(member.userId)} className="ml-2 text-coral">
                    グループから外す
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="text-text-soft">メンバーはまだいません。</p>}
          </div>

          {members.length > 0 && (
            <button onClick={handleSaveOrder} className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
              {orderSaved ? "保存しました" : "この順序で保存"}
            </button>
          )}
        </>
      )}
    </div>
  )
}
