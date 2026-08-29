import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { reactivateUser, retireUser, listUsers, type UserSummary } from "../../../api/users"

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function reload() {
    setUsers(await listUsers())
  }

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
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

  async function handleRetire(userId: number) {
    await retireUser(userId)
    await reload()
  }

  async function handleReactivate(userId: number) {
    await reactivateUser(userId)
    await reload()
  }

  return (
    <div className="mx-auto max-w-[1000px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">利用者管理</h1>
        <Link to="/admin/users/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          + 新規登録
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      {loading ? (
        <p className="text-text-soft">読み込み中...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-[14px] border border-border bg-surface text-sm">
          <thead className="bg-surface-alt text-left text-[11.5px] text-text-soft">
            <tr>
              <th className="px-4 py-2">氏名</th>
              <th className="px-4 py-2">ログインID</th>
              <th className="px-4 py-2">権限</th>
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
      )}
    </div>
  )
}
