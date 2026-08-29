import { type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function MeetingRoomIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M8 21h8M12 16v5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l10 18H2z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: "/", label: "トップ", Icon: HomeIcon },
  { to: "/calendar", label: "スケジュール", Icon: CalendarIcon },
  { to: "/rooms", label: "会議室予約", Icon: MeetingRoomIcon },
  { to: "/meeting-finder", label: "会議候補日抽出", Icon: ClockIcon },
  { to: "/board", label: "掲示板", Icon: BoardIcon },
  { to: "/files", label: "ファイル", Icon: FolderIcon },
  { to: "/incident-reports", label: "事故報告", Icon: AlertIcon },
]

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
                    ? "flex items-center gap-1.5 border-b-2 border-indigo pb-1 text-sm font-bold text-indigo"
                    : "flex items-center gap-1.5 pb-1 text-sm text-text-soft"
                }
              >
                <item.Icon />
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
