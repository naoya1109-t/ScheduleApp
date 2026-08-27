import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../../api/client"
import {
  createUser,
  listUsers,
  reactivateUser,
  retireUser,
  type UserRole,
  type UserSummary,
} from "../../../api/users"

const emptyForm = {
  loginId: "",
  password: "",
  name: "",
  email: "",
  employeeNo: "",
  role: "general" as UserRole,
}

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [form, setForm] = useState(emptyForm)
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

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createUser({ ...form, groupIds: [] })
      setForm(emptyForm)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "利用者の作成に失敗しました")
    }
  }

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
      <h1 className="mb-6 text-[18px] font-bold">利用者管理</h1>

      <form
        onSubmit={handleCreate}
        className="mb-8 grid grid-cols-2 gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">ログインID</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.loginId}
            onChange={(e) => setForm({ ...form, loginId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">パスワード</label>
          <input
            type="password"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">氏名</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">社員番号</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.employeeNo}
            onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">メールアドレス</label>
          <input
            type="email"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">権限区分</label>
          <select
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          >
            <option value="general">一般社員</option>
            <option value="admin">管理者</option>
          </select>
        </div>
        {error && <p className="col-span-2 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          className="col-span-2 rounded-md bg-indigo py-2 text-sm font-bold text-white"
        >
          利用者を登録
        </button>
      </form>

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
