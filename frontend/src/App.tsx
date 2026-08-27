import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { RequireAuth } from "./context/RequireAuth"
import { LoginPage } from "./pages/login/LoginPage"
import { UsersPage } from "./pages/admin/users/UsersPage"

function TopPage() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
        <span className="text-[15px] font-bold">ケアマックス グループウェア</span>
        <div className="flex items-center gap-4 text-sm">
          <span>{user?.name}</span>
          <button onClick={() => logout()} className="text-text-soft">
            ログアウト
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] p-8">
        <div className="rounded-[14px] border border-border bg-surface p-6 shadow-sm">
          <p className="text-text-soft">
            トップ画面は準備中です。docs/mockups/casemax_mockup_top.html を参考に実装していきます。
          </p>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <TopPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth adminOnly>
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
