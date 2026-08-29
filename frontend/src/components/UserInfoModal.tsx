import { useEffect, useState } from "react"
import { listJobTitles, type JobTitle } from "../api/jobTitles"
import { getDirectoryUser, type DirectoryUserDetail } from "../api/userDirectory"

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-border px-2.5 py-1 text-[11px] font-bold text-text-soft"
    >
      {copied ? "コピーしました" : "コピー"}
    </button>
  )
}

export function UserInfoModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [user, setUser] = useState<DirectoryUserDetail | null>(null)
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([getDirectoryUser(userId), listJobTitles()]).then(([userData, jobTitleData]) => {
      if (cancelled) return
      setUser(userData)
      setJobTitles(jobTitleData)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const jobTitleName = jobTitles.find((jobTitle) => jobTitle.jobTitleId === user?.jobTitleId)?.name ?? null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[14px] border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {!user ? (
          <p className="text-text-soft">読み込み中...</p>
        ) : (
          <>
            <h2 className="mb-4 text-[16px] font-bold">{user.name}</h2>
            <div className="flex flex-col gap-3 text-sm">
              {jobTitleName && (
                <div>
                  <div className="mb-0.5 text-[11px] font-bold text-text-soft">役職</div>
                  <div>{jobTitleName}</div>
                </div>
              )}
              {user.employeeNo && (
                <div>
                  <div className="mb-0.5 text-[11px] font-bold text-text-soft">社員番号</div>
                  <div>{user.employeeNo}</div>
                </div>
              )}
              <div>
                <div className="mb-0.5 text-[11px] font-bold text-text-soft">メールアドレス</div>
                {user.email ? (
                  <div className="flex items-center justify-between gap-2">
                    <span>{user.email}</span>
                    <CopyButton value={user.email} />
                  </div>
                ) : (
                  <span className="text-text-soft">未設定</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-md border border-border py-2 text-sm font-bold text-text-soft"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  )
}
