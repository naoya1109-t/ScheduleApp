import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { VisibleOccurrence } from "../../api/calendar"
import { listRecentFiles, type FileItem } from "../../api/files"
import { listGroups, listMyGroups, type Group } from "../../api/groups"
import { listPosts, type PostSummary } from "../../api/posts"
import { getTopPageSettings, getWeekGantt, type WeekGanttRow } from "../../api/topPage"

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatMd(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function occurrencesOnDay(occurrences: VisibleOccurrence[], day: Date): VisibleOccurrence[] {
  return occurrences.filter((occurrence) => isSameDay(new Date(occurrence.startAt), day))
}

export function TopPage() {
  const [anchor, setAnchor] = useState<Date>(startOfToday())
  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | null>(null)
  const [rows, setRows] = useState<WeekGanttRow[]>([])
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [boardCount, setBoardCount] = useState(5)
  const [fileCount, setFileCount] = useState(5)

  const today = startOfToday()
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i))

  useEffect(() => {
    let cancelled = false
    listMyGroups()
      .then((mine) => {
        if (cancelled) return
        if (mine.length > 0) {
          setGroups(mine)
          setGroupId(mine[0].groupId)
        } else {
          return listGroups().then((all) => {
            if (!cancelled) setGroups(all)
          })
        }
      })
      .catch(() => undefined)
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

  useEffect(() => {
    let cancelled = false
    const from = days[0].toISOString()
    const to = addDays(days[6], 1).toISOString()
    getWeekGantt(groupId, from, to)
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, anchor])

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5 p-8">
      <div className="rounded-[14px] border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between bg-indigo px-6 py-3.5">
          <h2 className="text-[15px] font-bold text-white">今週のスケジュール</h2>
          <Link to="/calendar" className="text-[12px] font-bold text-white/90">
            スケジュール画面へ
          </Link>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] font-bold">
              {days[0].getFullYear()}/{formatMd(days[0])} 〜 {formatMd(days[6])}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
                onClick={() => setAnchor((prev) => addDays(prev, -7))}
              >
                前週
              </button>
              <button
                className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
                onClick={() => setAnchor((prev) => addDays(prev, -1))}
              >
                前日
              </button>
              <button
                className="rounded-md border border-indigo px-2.5 py-1 text-[11.5px] font-bold text-indigo"
                onClick={() => setAnchor(startOfToday())}
              >
                本日
              </button>
              <button
                className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
                onClick={() => setAnchor((prev) => addDays(prev, 1))}
              >
                翌日
              </button>
              <button
                className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold"
                onClick={() => setAnchor((prev) => addDays(prev, 7))}
              >
                翌週
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[132px_repeat(7,1fr)] border-l border-t border-border">
            <div className="flex flex-col gap-1 border-b border-r border-border bg-surface-alt p-1.5">
              <div className="text-[9px] font-medium text-text-soft">表示グループ</div>
              <select
                className="rounded-md border border-border bg-white px-2 py-1 text-[11.5px] font-bold"
                value={groupId ?? ""}
                onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">(自分のみ)</option>
                {groups.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex flex-col items-center gap-0.5 border-b border-r border-border p-1.5 text-center text-[11px] font-semibold ${
                  isSameDay(day, today) ? "bg-indigo-soft text-indigo" : "bg-surface-alt text-text-soft"
                }`}
              >
                <span>
                  {WEEKDAY_LABELS[(day.getDay() + 6) % 7]} {formatMd(day)}
                </span>
                {isSameDay(day, today) && (
                  <span className="rounded bg-indigo px-1.5 py-0.5 text-[9px] font-bold text-white">
                    本日
                  </span>
                )}
              </div>
            ))}

            {rows.map((row) => (
              <Fragment key={row.userId}>
                <div className="flex flex-col gap-1.5 justify-center border-b border-r border-border p-2">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold">
                    {row.isSelf && <span className="h-1.5 w-1.5 rounded-full bg-indigo" />}
                    {row.name}
                  </div>
                  <Link
                    to={`/calendar/month/${row.userId}`}
                    className="w-fit rounded-md border border-border bg-surface-alt px-2 py-0.5 text-[10.5px] text-text-soft"
                  >
                    月表示
                  </Link>
                </div>
                {days.map((day) => {
                  const dayOccurrences = occurrencesOnDay(row.occurrences, day)
                  return (
                    <div
                      key={`${row.userId}-${day.toISOString()}`}
                      className={`flex min-h-[54px] flex-col justify-center gap-1 border-b border-r border-border p-1.5 ${
                        isSameDay(day, today) ? "bg-indigo-soft" : "bg-white"
                      }`}
                    >
                      {dayOccurrences.map((occurrence) => (
                        <div key={occurrence.eventId} className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-indigo" />
                          {new Date(occurrence.startAt).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {occurrence.isBusyOnly ? "予定あり" : occurrence.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-[14px] border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between bg-coral px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] font-bold text-white">お知らせ・掲示板</h2>
              <Link
                to="/board/new"
                className="rounded-md bg-white/20 px-2.5 py-1 text-[11.5px] font-bold text-white"
              >
                新規登録
              </Link>
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
              <Link to="/files" className="rounded-md bg-white/20 px-2.5 py-1 text-[11.5px] font-bold text-white">
                新規登録
              </Link>
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
