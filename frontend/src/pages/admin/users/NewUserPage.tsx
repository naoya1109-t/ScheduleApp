import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError } from "../../../api/client"
import { createUser, type UserRole } from "../../../api/users"

const emptyForm = {
  loginId: "",
  password: "",
  name: "",
  email: "",
  employeeNo: "",
  role: "general" as UserRole,
}

export function NewUserPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createUser({ ...form, groupIds: [] })
      navigate("/admin/users")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "利用者の作成に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">利用者 新規登録</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
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

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="rounded-md border border-border px-4 py-2 text-sm font-bold text-text-soft"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
