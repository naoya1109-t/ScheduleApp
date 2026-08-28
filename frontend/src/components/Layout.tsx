import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NAV_ITEMS = [
  { to: "/", label: "トップ" },
  { to: "/calendar", label: "スケジュール" },
  { to: "/board", label: "掲示板" },
]

const ADMIN_NAV_ITEMS = [
  { to: "/admin/users", label: "利用者管理" },
  { to: "/admin/holidays", label: "祝日設定" },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
        <div className="flex items-center gap-8">
          <span className="text-[15px] font-bold">ケアマックス グループウェア</span>
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  location.pathname === item.to
                    ? "border-b-2 border-indigo pb-1 text-sm font-bold text-indigo"
                    : "pb-1 text-sm text-text-soft"
                }
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" &&
              ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    location.pathname === item.to
                      ? "border-b-2 border-indigo pb-1 text-sm font-bold text-indigo"
                      : "pb-1 text-sm text-text-soft"
                  }
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{user?.name}</span>
          <button onClick={() => logout()} className="text-text-soft">
            ログアウト
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
