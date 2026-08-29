import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError } from "../../api/client"
import { listGroups, type Group } from "../../api/groups"
import { createPost, uploadAttachment, type PostVisibilityScope } from "../../api/posts"
import { FileDropZone } from "../../components/FileDropZone"
import { RichTextEditor } from "../../components/RichTextEditor"

export function NewPostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [visibilityScope, setVisibilityScope] = useState<PostVisibilityScope>("company")
  const [groupId, setGroupId] = useState("")
  const [groups, setGroups] = useState<Group[]>([])
  const [publishStartAt, setPublishStartAt] = useState("")
  const [publishEndAt, setPublishEndAt] = useState("")
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listGroups().then(setGroups)
  }, [])

  function removeAttachment(index: number) {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (publishStartAt && publishEndAt && new Date(publishEndAt) <= new Date(publishStartAt)) {
      setError("公開終了日時は公開開始日時より後にしてください")
      return
    }
    setSubmitting(true)
    try {
      const created = await createPost({
        title,
        bodyHtml,
        visibilityScope,
        groupId: visibilityScope === "group" && groupId ? Number(groupId) : null,
        publishStartAt: publishStartAt ? new Date(publishStartAt).toISOString() : null,
        publishEndAt: publishEndAt ? new Date(publishEndAt).toISOString() : null,
      })
      for (const file of attachmentFiles) {
        await uploadAttachment(created.postId, file)
      }
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

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">公開範囲</label>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={visibilityScope === "group" ? `group:${groupId}` : "company"}
            onChange={(e) => {
              const value = e.target.value
              if (value === "company") {
                setVisibilityScope("company")
                setGroupId("")
              } else {
                setVisibilityScope("group")
                setGroupId(value.slice("group:".length))
              }
            }}
          >
            <option value="company">全社</option>
            {groups.map((group) => (
              <option key={group.groupId} value={`group:${group.groupId}`}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">
              公開開始日時(任意・未指定は即時公開)
            </label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={publishStartAt}
              onChange={(e) => setPublishStartAt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">
              公開終了日時(任意・未指定は無期限)
            </label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={publishEndAt}
              onChange={(e) => setPublishEndAt(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">添付ファイル(任意)</label>
          <FileDropZone multiple onFilesSelected={(files) => setAttachmentFiles((prev) => [...prev, ...files])} />
          {attachmentFiles.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {attachmentFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-1.5 text-[12.5px]"
                >
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-coral"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
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
