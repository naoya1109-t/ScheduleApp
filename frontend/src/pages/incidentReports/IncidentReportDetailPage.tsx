import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getIncidentReport, markChecked, markNotified, type IncidentReport } from "../../api/incidentReports"

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[11px] font-bold text-text-soft">{label}</div>
      <div className="whitespace-pre-wrap text-sm">{value}</div>
    </div>
  )
}

export function IncidentReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const [report, setReport] = useState<IncidentReport | null>(null)

  useEffect(() => {
    if (!reportId) return
    let cancelled = false
    getIncidentReport(Number(reportId)).then((data) => {
      if (!cancelled) setReport(data)
    })
    return () => {
      cancelled = true
    }
  }, [reportId])

  async function handleCheck() {
    if (!reportId) return
    setReport(await markChecked(Number(reportId)))
  }

  async function handleNotify() {
    if (!reportId) return
    setReport(await markNotified(Number(reportId)))
  }

  if (!report) {
    return <div className="p-8 text-text-soft">読み込み中...</div>
  }

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-2 text-[18px] font-bold">
        {report.customerName ?? report.customerCode} の事故報告
      </h1>
      <div className="mb-6 text-[11.5px] text-text-soft">
        発生日時: {new Date(report.occurredAt).toLocaleString("ja-JP")} ・ 入力者: {report.reporterName}
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6">
        <Field label="得意先コード" value={report.customerCode} />
        <Field label="商品名・該当商品" value={report.productName} />
        <Field label="事故区分" value={report.incidentCategory} />
        <Field label="事故内容" value={report.incidentContent} />
        <Field label="対処状況" value={report.responseStatus} />
        <Field label="具体的実施内容" value={report.actionTaken} />
        <Field label="説明文" value={report.description} />
        <Field label="返却倉庫名" value={report.returnWarehouse} />
        <div>
          <div className="text-[11px] font-bold text-text-soft">担当営業</div>
          <div className="text-sm">{report.salesRepName}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-soft">チェック状態</div>
            <div className="text-sm">
              {report.checkStatus === "checked"
                ? `確認済み(${new Date(report.checkedAt!).toLocaleString("ja-JP")})`
                : "未確認"}
            </div>
          </div>
          {report.checkStatus !== "checked" && (
            <button onClick={handleCheck} className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
              確認済みにする
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <div className="text-[11px] font-bold text-text-soft">周知記録</div>
            <div className="text-sm">
              {report.notifiedAt ? `周知済み(${new Date(report.notifiedAt).toLocaleString("ja-JP")})` : "未周知"}
            </div>
          </div>
          {!report.notifiedAt && (
            <button onClick={handleNotify} className="rounded-md bg-teal px-4 py-2 text-sm font-bold text-white">
              周知記録を残す
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
