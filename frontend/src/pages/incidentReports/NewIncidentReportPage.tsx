import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError } from "../../api/client"
import { createIncidentReport } from "../../api/incidentReports"
import { listUserDirectory, type DirectoryUser } from "../../api/userDirectory"

const emptyForm = {
  customerCode: "",
  customerName: "",
  salesRepId: "",
  productName: "",
  incidentCategory: "",
  incidentContent: "",
  responseStatus: "",
  actionTaken: "",
  description: "",
  returnWarehouse: "",
  occurredAt: "",
}

export function NewIncidentReportPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    listUserDirectory().then((data) => {
      if (!cancelled) setUsers(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const created = await createIncidentReport({
        customerCode: form.customerCode,
        customerName: form.customerName || null,
        salesRepId: Number(form.salesRepId),
        productName: form.productName || null,
        customerInfo: null,
        incidentCategory: form.incidentCategory || null,
        incidentContent: form.incidentContent || null,
        responseStatus: form.responseStatus || null,
        actionTaken: form.actionTaken || null,
        description: form.description || null,
        returnWarehouse: form.returnWarehouse || null,
        occurredAt: new Date(form.occurredAt).toISOString(),
      })
      navigate(`/incident-reports/${created.reportId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登録に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">事故報告 新規登録</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">得意先コード</label>
            <input
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={form.customerCode}
              onChange={(e) => setForm({ ...form, customerCode: e.target.value })}
              required
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">得意先名</label>
            <input
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">発生日時</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">担当営業</label>
            <select
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.salesRepId}
              onChange={(e) => setForm({ ...form, salesRepId: e.target.value })}
              required
            >
              <option value="">選択してください</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">商品名・該当商品</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">事故区分</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例: 送り先間違い"
            value={form.incidentCategory}
            onChange={(e) => setForm({ ...form, incidentCategory: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">事故内容</label>
          <textarea
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            rows={3}
            value={form.incidentContent}
            onChange={(e) => setForm({ ...form, incidentContent: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">対処状況</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.responseStatus}
            onChange={(e) => setForm({ ...form, responseStatus: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">具体的実施内容</label>
          <textarea
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            rows={3}
            value={form.actionTaken}
            onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">説明文</label>
          <textarea
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">返却倉庫名</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.returnWarehouse}
            onChange={(e) => setForm({ ...form, returnWarehouse: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>
    </div>
  )
}
