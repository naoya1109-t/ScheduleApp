import { type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NAV_ITEMS = [
  { to: "/", label: "トップ" },
  { to: "/calendar", label: "スケジュール" },
  { to: "/rooms", label: "会議室予約" },
  { to: "/meeting-finder", label: "会議候補日抽出" },
  { to: "/board", label: "掲示板" },
  { to: "/files", label: "ファイル" },
  { to: "/incident-reports", label: "事故報告" },
]

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function AdminLink() {
  const location = useLocation()
  const isActiveSection = location.pathname.startsWith("/admin")

  return (
    <Link
      to="/admin"
      className={
        isActiveSection
          ? "flex items-center gap-1.5 border-b-2 border-indigo pb-1 text-sm font-bold text-indigo"
          : "flex items-center gap-1.5 pb-1 text-sm text-text-soft"
      }
    >
      <GearIcon />
      管理
    </Link>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()

  return (
    <div className="group relative py-2">
      <span className="cursor-default text-sm">{user?.name}</span>
      <div className="invisible absolute right-0 top-full z-10 w-32 rounded-md border border-border bg-surface py-1 opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100">
        <button
          onClick={() => logout()}
          className="block w-full px-4 py-2 text-left text-sm text-text-soft hover:bg-surface-alt"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <img src="/caremax-logo.svg" alt="ケアマックスコーポレーション" className="h-9 w-auto" />
            <span className="text-[15px] font-bold">ケアマックス グループウェア</span>
          </div>
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
            {user?.role === "admin" && <AdminLink />}
          </nav>
        </div>
        <div className="flex items-center text-sm">
          <UserMenu />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
