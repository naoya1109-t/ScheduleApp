import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError } from "../../../api/client"
import { createGroup } from "../../../api/groups"

export function NewGroupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createGroup(name)
      navigate("/admin/groups")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "グループの登録に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">グループ 新規登録</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">グループ名</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/groups")}
            className="rounded-md border border-border px-4 py-2 text-sm font-bold text-text-soft"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
