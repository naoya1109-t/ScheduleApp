import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { ApiError } from "../../api/client"
import { useAuth } from "../../context/AuthContext"

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from
  const redirectTo = from ?? "/"

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(loginId, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[14px] border border-border bg-surface p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <img src="/caremax-mark.svg" alt="ケアマックスコーポレーション" className="h-9 w-auto" />
          <h1 className="text-[15px] font-bold">ケアマックス グループウェア</h1>
        </div>

        {from && (
          <p className="mb-4 rounded-md bg-surface-alt px-3 py-2 text-[12px] text-text-soft">
            ログインの有効期限が切れました。再度ログインしてください。
          </p>
        )}

        <label className="mb-1 block text-[11.5px] font-bold text-text-soft" htmlFor="loginId">
          ログインID
        </label>
        <input
          id="loginId"
          className="mb-4 w-full rounded-md border border-border px-3 py-2 text-sm"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="mb-1 block text-[11.5px] font-bold text-text-soft" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          className="mb-4 w-full rounded-md border border-border px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="mb-4 text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  )
}
