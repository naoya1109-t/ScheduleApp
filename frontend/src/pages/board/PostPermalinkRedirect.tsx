import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { ApiError } from "../../api/client"
import { getPostBySlug } from "../../api/posts"

export function PostPermalinkRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const [postId, setPostId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getPostBySlug(slug)
      .then((post) => {
        if (!cancelled) setPostId(post.postId)
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
    return (
      <div className="p-8 text-text-soft">この投稿は削除されたか、存在しません。</div>
    )
  }

  if (postId === null) {
    return <div className="p-8 text-text-soft">読み込み中...</div>
  }

  return <Navigate to={`/board/${postId}`} replace />
}
