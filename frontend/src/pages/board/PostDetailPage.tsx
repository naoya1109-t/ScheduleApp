import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  addComment,
  attachmentDownloadUrl,
  deleteAttachment,
  getPost,
  listAttachments,
  listComments,
  markPostRead,
  uploadAttachment,
  type Attachment,
  type Comment,
  type Post,
} from "../../api/posts"
import { FileDropZone } from "../../components/FileDropZone"

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [commentBody, setCommentBody] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!postId) return
    let cancelled = false
    const id = Number(postId)

    Promise.all([getPost(id), listComments(id), listAttachments(id)]).then(
      ([postData, commentData, attachmentData]) => {
        if (cancelled) return
        setPost(postData)
        setComments(commentData)
        setAttachments(attachmentData)
        markPostRead(id)
      },
    )

    return () => {
      cancelled = true
    }
  }, [postId])

  async function handleAddComment() {
    if (!postId || !commentBody.trim()) return
    const created = await addComment(Number(postId), commentBody)
    setComments((prev) => [...prev, created])
    setCommentBody("")
  }

  function handleCopyPermalink() {
    if (!post) return
    const url = `${window.location.origin}/board/link/${post.permalinkSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleUploadAttachments(files: File[]) {
    if (!postId) return
    for (const file of files) {
      const created = await uploadAttachment(Number(postId), file)
      setAttachments((prev) => [...prev, created])
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    await deleteAttachment(attachmentId)
    setAttachments((prev) => prev.filter((attachment) => attachment.attachmentId !== attachmentId))
  }

  if (!post) {
    return <div className="p-8 text-text-soft">読み込み中...</div>
  }

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-[18px] font-bold">{post.title}</h1>
        <button
          onClick={handleCopyPermalink}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
        >
          {copied ? "コピーしました" : "固定リンク"}
        </button>
      </div>
      <div className="mb-6 text-[11.5px] text-text-soft">
        更新者: {post.authorName} ・ {new Date(post.updatedAt).toLocaleString("ja-JP")}
      </div>

      <div
        className="mb-6 rounded-[14px] border border-border bg-surface p-6 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      <div className="mb-8 rounded-[14px] border border-border bg-surface p-6">
        <div className="mb-3">
          <h2 className="text-[13.5px] font-bold">添付ファイル</h2>
        </div>
        <div className="mb-3">
          <FileDropZone multiple onFilesSelected={handleUploadAttachments} />
        </div>
        <div className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.attachmentId}
              className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-2 text-sm"
            >
              <a href={attachmentDownloadUrl(attachment.attachmentId)} className="text-indigo">
                {attachment.fileName}
              </a>
              <button onClick={() => handleDeleteAttachment(attachment.attachmentId)} className="text-coral">
                削除
              </button>
            </div>
          ))}
          {attachments.length === 0 && <p className="text-[12.5px] text-text-soft">添付ファイルはありません。</p>}
        </div>
      </div>

      <h2 className="mb-3 text-[14px] font-bold">コメント</h2>
      <div className="mb-4 flex flex-col gap-3">
        {comments.map((comment) => (
          <div key={comment.commentId} className="rounded-md border border-border bg-surface p-3 text-sm">
            <div className="mb-1 text-[11.5px] font-bold text-text-soft">
              {comment.authorName} ・ {new Date(comment.createdAt).toLocaleString("ja-JP")}
            </div>
            {comment.body}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="コメントを入力"
        />
        <button
          onClick={handleAddComment}
          className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white"
        >
          送信
        </button>
      </div>
    </div>
  )
}
