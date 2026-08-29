import { Link } from "react-router-dom"
import { WeeklySchedule } from "../../components/WeeklySchedule"

export function CalendarPage() {
  return (
    <div className="mx-auto max-w-[1300px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">スケジュール</h1>
        <Link to="/calendar/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          + 予定を登録
        </Link>
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-5 shadow-sm">
        <WeeklySchedule />
      </div>
    </div>
  )
}
