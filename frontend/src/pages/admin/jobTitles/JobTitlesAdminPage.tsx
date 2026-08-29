import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../../../api/client"
import { deleteJobTitle, listJobTitles, updateJobTitle, type JobTitle } from "../../../api/jobTitles"

export function JobTitlesAdminPage() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setJobTitles(await listJobTitles())
  }

  useEffect(() => {
    let cancelled = false
    listJobTitles().then((data) => {
      if (!cancelled) setJobTitles(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function startEdit(jobTitle: JobTitle) {
    setEditingId(jobTitle.jobTitleId)
    setEditName(jobTitle.name)
  }

  async function handleUpdate(event: FormEvent, jobTitleId: number) {
    event.preventDefault()
    setError(null)
    try {
      await updateJobTitle(jobTitleId, editName)
      setEditingId(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "役職の更新に失敗しました")
    }
  }

  async function handleDelete(jobTitleId: number) {
    setError(null)
    try {
      await deleteJobTitle(jobTitleId)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "役職の削除に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[700px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">役職管理</h1>
        <Link to="/admin/job-titles/new" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          + 新規登録
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      <div className="flex flex-col gap-2">
        {jobTitles.map((jobTitle) =>
          editingId === jobTitle.jobTitleId ? (
            <form
              key={jobTitle.jobTitleId}
              onSubmit={(e) => handleUpdate(e, jobTitle.jobTitleId)}
              className="flex items-end gap-3 rounded-md border border-indigo bg-surface px-4 py-3"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-bold text-text-soft">役職名</label>
                <input
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="rounded-md bg-indigo px-3 py-1.5 text-[12px] font-bold text-white">
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
              >
                キャンセル
              </button>
            </form>
          ) : (
            <div
              key={jobTitle.jobTitleId}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="font-bold">{jobTitle.name}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(jobTitle)} className="text-indigo">
                  編集
                </button>
                <button onClick={() => handleDelete(jobTitle.jobTitleId)} className="text-coral">
                  削除
                </button>
              </div>
            </div>
          ),
        )}
        {jobTitles.length === 0 && <p className="text-text-soft">役職はまだ登録されていません。</p>}
      </div>
    </div>
  )
}
