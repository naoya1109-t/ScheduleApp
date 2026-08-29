import { Link } from "react-router-dom"

const ADMIN_MENU_ITEMS = [
  { to: "/admin/users", label: "利用者管理", description: "アカウントの作成・退職処理を行います" },
  { to: "/admin/groups", label: "グループ管理", description: "グループの追加・編集・削除を行います" },
  { to: "/admin/holidays", label: "祝日設定", description: "会社独自の休日カレンダーを設定します" },
  { to: "/admin/top-settings", label: "表示件数設定", description: "トップ画面の各種一覧の表示件数を設定します" },
  { to: "/admin/bulk-delete", label: "掲示板一括削除", description: "期間を指定して掲示板の投稿を一括削除します" },
  { to: "/admin/rooms", label: "会議室管理", description: "会議室の追加・編集・削除を行います" },
]

export function AdminIndexPage() {
  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">管理</h1>
      <div className="grid grid-cols-2 gap-4">
        {ADMIN_MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-[14px] border border-border bg-surface p-5 hover:border-indigo"
          >
            <div className="mb-1 text-[14px] font-bold">{item.label}</div>
            <div className="text-[12px] text-text-soft">{item.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
