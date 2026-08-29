import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { ApiError } from "../../api/client"
import { getFileBySlug } from "../../api/files"

export function FilePermalinkRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const [fileId, setFileId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getFileBySlug(slug)
      .then((file) => {
        if (!cancelled) setFileId(file.fileId)
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (notFound) {
    return <div className="p-8 text-text-soft">このファイルは削除されたか、存在しません。</div>
  }

  if (fileId === null) {
    return <div className="p-8 text-text-soft">読み込み中...</div>
  }

  return <Navigate to={`/files/${fileId}`} replace />
}
