import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { listIncidentReports, type IncidentReport } from "../../api/incidentReports"
import { listUserDirectory, type DirectoryUser } from "../../api/userDirectory"

export function IncidentReportListPage() {
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [salesRepId, setSalesRepId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listUserDirectory().then((data) => {
      if (!cancelled) setUsers(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listIncidentReports(salesRepId !== null ? { salesRepId } : {})
      .then((data) => {
        if (cancelled) return
        setReports(data)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [salesRepId])

  return (
    <div className="mx-auto max-w-[900px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">事故報告</h1>
        <Link to="/incident-reports/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          新規登録
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-[11.5px] font-bold text-text-soft">担当営業で絞り込み</label>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={salesRepId ?? ""}
          onChange={(e) => setSalesRepId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-text-soft">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <Link
              key={report.reportId}
              to={`/incident-reports/${report.reportId}`}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <div>
                <div className="font-bold">
                  {report.customerName ?? report.customerCode} ・ {report.incidentCategory ?? "事故区分未設定"}
                </div>
                <div className="text-[11.5px] text-text-soft">
                  発生日時: {new Date(report.occurredAt).toLocaleString("ja-JP")} ・ 担当営業:{" "}
                  {report.salesRepName} ・ 入力者: {report.reporterName}
                </div>
              </div>
              <span
                className={
                  report.checkStatus === "checked"
                    ? "rounded bg-teal-soft px-2 py-1 text-[10.5px] font-bold text-teal"
                    : "rounded bg-coral-soft px-2 py-1 text-[10.5px] font-bold text-coral"
                }
              >
                {report.checkStatus === "checked" ? "確認済み" : "未確認"}
              </span>
            </Link>
          ))}
          {reports.length === 0 && <p className="text-text-soft">事故報告はまだありません。</p>}
        </div>
      )}
    </div>
  )
}
