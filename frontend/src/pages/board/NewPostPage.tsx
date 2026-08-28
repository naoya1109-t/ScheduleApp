import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError } from "../../api/client"
import { createPost, type PostVisibilityScope } from "../../api/posts"
import { RichTextEditor } from "../../components/RichTextEditor"

export function NewPostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [visibilityScope, setVisibilityScope] = useState<PostVisibilityScope>("company")
  const [groupId, setGroupId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const created = await createPost({
        title,
        bodyHtml,
        visibilityScope,
        groupId: visibilityScope === "group" && groupId ? Number(groupId) : null,
      })
      navigate(`/board/${created.postId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "投稿に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">お知らせ・掲示板 新規投稿</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">表題</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">本文</label>
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">公開範囲</label>
            <select
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={visibilityScope}
              onChange={(e) => setVisibilityScope(e.target.value as PostVisibilityScope)}
            >
              <option value="company">全社</option>
              <option value="group">部署別</option>
            </select>
          </div>
          {visibilityScope === "group" && (
            <div>
              <label className="mb-1 block text-[11.5px] font-bold text-text-soft">部署ID</label>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                inputMode="numeric"
                required
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  )
}
