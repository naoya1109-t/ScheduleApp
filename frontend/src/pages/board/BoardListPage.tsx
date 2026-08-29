import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { listPosts, type PostSummary } from "../../api/posts"

export function BoardListPage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-[900px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">お知らせ・掲示板</h1>
        <Link
          to="/board/new"
          className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white"
        >
          新規登録
        </Link>
      </div>

      {loading ? (
        <p className="text-text-soft">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const now = new Date()
            const isScheduled = post.publishStartAt !== null && new Date(post.publishStartAt) > now
            const isExpired = post.publishEndAt !== null && new Date(post.publishEndAt) < now
            return (
            <Link
              key={post.postId}
              to={`/board/${post.postId}`}
              className="rounded-[14px] border border-border bg-surface p-5 shadow-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                {!post.isRead && (
                  <span className="rounded bg-coral-soft px-1.5 py-0.5 text-[10px] font-bold text-coral">
                    未読
                  </span>
                )}
                {isScheduled && (
                  <span className="rounded bg-indigo-soft px-1.5 py-0.5 text-[10px] font-bold text-indigo">
                    公開予約中({new Date(post.publishStartAt!).toLocaleString("ja-JP")}〜)
                  </span>
                )}
                {isExpired && (
                  <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-bold text-text-soft">
                    掲載終了({new Date(post.publishEndAt!).toLocaleString("ja-JP")}まで)
                  </span>
                )}
                <span className="text-[13.5px] font-bold text-text">{post.title}</span>
              </div>
              <div
                className="mb-2 text-[12.5px] text-text-soft"
                dangerouslySetInnerHTML={{ __html: post.excerptHtml }}
              />
              <div className="text-[11.5px] text-text-soft">
                更新者: {post.authorName} ・ {new Date(post.updatedAt).toLocaleDateString("ja-JP")}
              </div>
            </Link>
            )
          })}
          {posts.length === 0 && <p className="text-text-soft">投稿はまだありません。</p>}
        </div>
      )}
    </div>
  )
}
