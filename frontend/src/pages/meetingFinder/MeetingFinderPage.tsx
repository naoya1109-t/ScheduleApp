import { useEffect, useState } from "react"
import { createEvent } from "../../api/calendar"
import { ApiError } from "../../api/client"
import { listGroupMembers, listGroups, type Group, type GroupMember } from "../../api/groups"
import { searchMeetingCandidates, type MeetingCandidate } from "../../api/meetingFinder"
import { useAuth } from "../../context/AuthContext"

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]
const CIRCLED_NUMBERS = ["①", "②", "③"]
const DURATION_OPTIONS: { value: 30 | 60 | 90 | 120; label: string }[] = [
  { value: 30, label: "30分" },
  { value: 60, label: "1時間" },
  { value: 90, label: "1時間30分" },
  { value: 120, label: "2時間" },
]

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function formatDateJa(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAY_LABELS[date.getDay()]})`
}

function formatTimeRange(start: Date, end: Date): string {
  return `${pad(start.getHours())}:${pad(start.getMinutes())}〜${pad(end.getHours())}:${pad(end.getMinutes())}`
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function MeetingFinderPage() {
  const { user } = useAuth()
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<number | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [durationMinutes, setDurationMinutes] = useState<30 | 60 | 90 | 120>(60)
  const [toDate, setToDate] = useState(toDateInputValue(addDays(today, 14)))
  const [candidates, setCandidates] = useState<MeetingCandidate[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [createdSlots, setCreatedSlots] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false
    listGroups().then((data) => {
      if (cancelled) return
      setGroups(data)
      if (data.length > 0) setGroupId(data[0].groupId)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (groupId === null) return
    let cancelled = false
    listGroupMembers(groupId).then((data) => {
      if (cancelled) return
      const others = data.filter((member) => member.userId !== user?.userId)
      setMembers(others)
      setSelectedMemberIds(new Set(others.map((member) => member.userId)))
    })
    return () => {
      cancelled = true
    }
  }, [groupId, user])

  function toggleMember(memberId: number) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  async function handleSearch() {
    if (!user) return
    setError(null)
    setSearching(true)
    setCandidates(null)
    setCreatedSlots(new Set())
    try {
      const userIds = [user.userId, ...selectedMemberIds]
      const from = today.toISOString()
      const to = new Date(`${toDate}T23:59:59`).toISOString()
      const result = await searchMeetingCandidates({ userIds, durationMinutes, from, to })
      setCandidates(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "検索に失敗しました")
    } finally {
      setSearching(false)
    }
  }

  function buildCopyText(list: MeetingCandidate[]): string {
    const lines = list.map((candidate, index) => {
      const start = new Date(candidate.startAt)
      const end = new Date(candidate.endAt)
      return `${CIRCLED_NUMBERS[index]} ${formatDateJa(start)} ${formatTimeRange(start, end)}`
    })
    return [
      "下記の候補日程より、ご都合の良い日程をお知らせいただけますと幸いです。",
      "",
      ...lines,
      "",
      "何卒よろしくお願いいたします。",
    ].join("\n")
  }

  function handleCopy() {
    if (!candidates || candidates.length === 0) return
    navigator.clipboard.writeText(buildCopyText(candidates)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCreateEvent(candidate: MeetingCandidate) {
    await createEvent({
      title: "会議",
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })
    setCreatedSlots((prev) => new Set(prev).add(candidate.startAt))
  }

  return (
    <div className="mx-auto max-w-[1100px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">会議候補日時の自動抽出</h1>

      <div className="grid grid-cols-[380px_1fr] gap-5">
        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-5">
          <div>
            <div className="mb-2 text-[11.5px] font-bold text-text-soft">対象者(部署を選ぶとメンバーが一覧表示されます)</div>
            <select
              className="mb-3 w-full rounded-md border border-border px-3 py-2 text-sm font-bold"
              value={groupId ?? ""}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
            >
              {groups.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.name}
                </option>
              ))}
            </select>
            <div className="overflow-hidden rounded-md border border-border">
              <label className="flex items-center gap-2 border-b border-border bg-surface-alt px-3 py-2 text-sm">
                <input type="checkbox" checked disabled />
                {user?.name}(自分)
                <span className="ml-auto rounded bg-surface-alt px-1.5 py-0.5 text-[10px] text-text-soft">
                  主催者
                </span>
              </label>
              {members.map((member) => (
                <label
                  key={member.userId}
                  className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.has(member.userId)}
                    onChange={() => toggleMember(member.userId)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[11.5px] font-bold text-text-soft">会議の所要時間</div>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm font-bold"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) as 30 | 60 | 90 | 120)}
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-[11.5px] font-bold text-text-soft">検索期間</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-border px-3 py-2 text-[12.5px] font-bold">
                本日 {formatDateJa(today)}
              </div>
              <span className="text-text-soft">〜</span>
              <input
                type="date"
                className="flex-1 rounded-md border border-border px-3 py-2 text-[12.5px] font-bold text-indigo"
                value={toDate}
                min={toDateInputValue(today)}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="mt-1 text-[10.5px] text-text-soft">既定は本日から2週間。終了日は変更できます</div>
          </div>

          <div>
            <div className="mb-1 text-[11.5px] font-bold text-text-soft">営業時間帯</div>
            <div className="rounded-md border border-border bg-surface-alt px-3 py-2 text-[12.5px] font-semibold text-text-soft">
              平日 9:00〜17:30(固定)
            </div>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            onClick={handleSearch}
            disabled={searching}
            className="rounded-md bg-indigo py-3 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {searching ? "検索中..." : "この条件で候補日を検索"}
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-5">
          <h2 className="text-[14.5px] font-bold">候補日時{candidates ? `(${candidates.length}件)` : ""}</h2>

          {!candidates && <p className="text-text-soft">左の条件を指定して検索してください。</p>}

          {candidates && candidates.length === 0 && (
            <p className="text-text-soft">条件に合う候補が見つかりませんでした。</p>
          )}

          {candidates && candidates.length > 0 && (
            <>
              <div className="flex flex-col gap-3">
                {candidates.map((candidate, index) => {
                  const start = new Date(candidate.startAt)
                  const end = new Date(candidate.endAt)
                  const created = createdSlots.has(candidate.startAt)
                  return (
                    <div
                      key={candidate.startAt}
                      className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-sm font-bold text-teal">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-[14.5px] font-bold">{formatDateJa(start)}</div>
                        <div className="text-[12.5px] text-text-soft">{formatTimeRange(start, end)}</div>
                        <div className="mt-1 w-fit rounded bg-teal-soft px-2 py-0.5 text-[10.5px] font-bold text-teal">
                          選択した{1 + selectedMemberIds.size}名全員が参加可能
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateEvent(candidate)}
                        disabled={created}
                        className="shrink-0 rounded-md bg-indigo px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
                      >
                        {created ? "作成済み" : "この日程で予定を作成"}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-text-soft">
                ※「非表示」設定の予定も、時間帯は埋まっているものとして計算しています
              </p>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-text-soft">コピー用テキスト</span>
                  <button
                    onClick={handleCopy}
                    className="rounded-md bg-indigo px-3.5 py-2 text-[12px] font-bold text-white"
                  >
                    {copied ? "コピーしました" : "コピーする"}
                  </button>
                </div>
                <div className="whitespace-pre-line rounded-md border border-border bg-surface-alt p-4 text-[12.5px] leading-relaxed">
                  {buildCopyText(candidates)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
