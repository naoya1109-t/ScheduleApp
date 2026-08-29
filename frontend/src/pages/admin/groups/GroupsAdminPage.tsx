import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../../../api/client"
import { deleteGroup, listGroups, updateGroup, type Group } from "../../../api/groups"

export function GroupsAdminPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setGroups(await listGroups())
  }

  useEffect(() => {
    let cancelled = false
    listGroups().then((data) => {
      if (!cancelled) setGroups(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function startEdit(group: Group) {
    setEditingGroupId(group.groupId)
    setEditName(group.name)
  }

  async function handleUpdate(event: FormEvent, groupId: number) {
    event.preventDefault()
    setError(null)
    try {
      await updateGroup(groupId, editName)
      setEditingGroupId(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "グループの更新に失敗しました")
    }
  }

  async function handleDelete(groupId: number) {
    setError(null)
    try {
      await deleteGroup(groupId)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "グループの削除に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[700px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">グループ管理</h1>
        <Link to="/admin/groups/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          + 新規登録
        </Link>
      </div>

      <p className="mb-4 text-[12px] text-text-soft">メンバーの追加・削除・表示順の設定は「利用者管理」から行います。</p>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      <div className="flex flex-col gap-2">
        {groups.map((group) =>
          editingGroupId === group.groupId ? (
            <form
              key={group.groupId}
              onSubmit={(e) => handleUpdate(e, group.groupId)}
              className="flex items-end gap-3 rounded-md border border-indigo bg-surface px-4 py-3"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-bold text-text-soft">グループ名</label>
                <input
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="rounded-md bg-indigo px-3 py-1.5 text-[12px] font-bold text-white">
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditingGroupId(null)}
                className="rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
              >
                キャンセル
              </button>
            </form>
          ) : (
            <div
              key={group.groupId}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="font-bold">{group.name}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(group)} className="text-indigo">
                  編集
                </button>
                <button onClick={() => handleDelete(group.groupId)} className="text-coral">
                  削除
                </button>
              </div>
            </div>
          ),
        )}
        {groups.length === 0 && <p className="text-text-soft">グループはまだ登録されていません。</p>}
      </div>
    </div>
  )
}
