import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { deleteFile, downloadUrl, getFile, type FileItem } from "../../api/files"

export function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()
  const [file, setFile] = useState<FileItem | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!fileId) return
    let cancelled = false
    getFile(Number(fileId)).then((data) => {
      if (!cancelled) setFile(data)
    })
    return () => {
      cancelled = true
    }
  }, [fileId])

  function handleCopyPermalink() {
    if (!file) return
    const url = `${window.location.origin}/files/link/${file.permalinkSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDelete() {
    if (!file) return
    await deleteFile(file.fileId)
    navigate("/files")
  }

  if (!file) {
    return <div className="p-8 text-text-soft">読み込み中...</div>
  }

  return (
    <div className="mx-auto max-w-[700px] p-8">
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-[18px] font-bold">{file.fileName}</h1>
        <button
          onClick={handleCopyPermalink}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
        >
          {copied ? "コピーしました" : "固定リンク"}
        </button>
      </div>
      <div className="mb-6 text-[11.5px] text-text-soft">
        更新者: {file.updatedByName} ・ {new Date(file.updatedAt).toLocaleString("ja-JP")}
      </div>

      <div className="flex items-center gap-4 rounded-[14px] border border-border bg-surface p-6">
        <a
          href={downloadUrl(file.fileId)}
          className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white"
        >
          ダウンロード
        </a>
        <button onClick={handleDelete} className="text-sm text-coral">
          削除
        </button>
      </div>
    </div>
  )
}
