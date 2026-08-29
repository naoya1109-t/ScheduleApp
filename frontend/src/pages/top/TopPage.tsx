import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { WeeklySchedule } from "../../components/WeeklySchedule"
import { listRecentFiles, type FileItem } from "../../api/files"
import { listPosts, type PostSummary } from "../../api/posts"
import { getTopPageSettings } from "../../api/topPage"

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function NewRegistrationLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-[11.5px] font-bold text-white"
    >
      <PlusIcon />
      新規登録
    </Link>
  )
}

export function TopPage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [boardCount, setBoardCount] = useState(5)
  const [fileCount, setFileCount] = useState(5)

  useEffect(() => {
    let cancelled = false
    getTopPageSettings()
      .then((settings) => {
        if (cancelled) return
        setBoardCount(settings.boardDisplayCount)
        setFileCount(settings.fileDisplayCount)
      })
      .catch(() => undefined)
    listPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch(() => undefined)
    listRecentFiles(10)
      .then((data) => {
        if (!cancelled) setFiles(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5 p-8">
      <div className="rounded-[14px] border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between bg-indigo px-6 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-white">今週のスケジュール</h2>
            <NewRegistrationLink to="/calendar/new" />
          </div>
          <Link to="/calendar" className="text-[12px] font-bold text-white/90">
            スケジュール画面へ
          </Link>
        </div>
        <div className="p-5">
          <WeeklySchedule />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-[14px] border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between bg-coral px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] font-bold text-white">お知らせ・掲示板</h2>
              <NewRegistrationLink to="/board/new" />
            </div>
            <Link to="/board" className="text-[12px] font-bold text-white/90">
              もっと見る
            </Link>
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            {posts.slice(0, boardCount).map((post) => (
              <Link
                key={post.postId}
                to={`/board/${post.postId}`}
                className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-none last:pb-0"
              >
                <span className="text-[13.5px] font-semibold">{post.title}</span>
                <span className="text-[11.5px] text-text-soft">
                  更新者: {post.authorName} ・ {new Date(post.updatedAt).toLocaleDateString("ja-JP")}
                </span>
              </Link>
            ))}
            {posts.length === 0 && <p className="text-text-soft">投稿はまだありません。</p>}
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between bg-teal px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] font-bold text-white">ファイル共有</h2>
              <NewRegistrationLink to="/files" />
            </div>
            <Link to="/files" className="text-[12px] font-bold text-white/90">
              もっと見る
            </Link>
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            {files.slice(0, fileCount).map((file) => (
              <div
                key={file.fileId}
                className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-none last:pb-0"
              >
                <span className="text-[13.5px] font-semibold">{file.fileName}</span>
                <span className="text-[11.5px] text-text-soft">
                  更新者: {file.updatedByName} ・ {new Date(file.updatedAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
            {files.length === 0 && <p className="text-text-soft">ファイルはまだありません。</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
