import { useState } from "react"
import type { Group, GroupMember } from "../api/groups"

export interface GroupedMembers {
  group: Group
  members: GroupMember[]
}

export function UserPickerModal({
  groupedMembers,
  selectedUserIds,
  onToggleUser,
  onToggleGroup,
  onClose,
}: {
  groupedMembers: GroupedMembers[]
  selectedUserIds: number[]
  onToggleUser: (userId: number) => void
  onToggleGroup: (memberIds: number[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim()

  const visibleGroups = groupedMembers
    .map(({ group, members }) => ({
      group,
      members: members.filter((member) => member.name.includes(normalizedQuery)),
    }))
    .filter(({ members }) => members.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-[14px] border border-border bg-surface p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold">利用者を選択</h2>
          <button onClick={onClose} className="text-text-soft">
            ✕
          </button>
        </div>

        <input
          className="mb-3 rounded-md border border-border px-3 py-2 text-sm"
          placeholder="名前で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {visibleGroups.map(({ group, members }) => {
            const allSelected = members.every((member) => selectedUserIds.includes(member.userId))
            return (
              <div key={group.groupId} className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-text-soft">{group.name}</span>
                  <button
                    type="button"
                    onClick={() => onToggleGroup(members.map((member) => member.userId))}
                    className="text-[11px] font-bold text-indigo"
                  >
                    {allSelected ? "全員解除" : "全員選択"}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  {members.map((member) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface-alt"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(member.userId)}
                        onChange={() => onToggleUser(member.userId)}
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {visibleGroups.length === 0 && (
            <p className="text-[12.5px] text-text-soft">該当する利用者がいません。</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 rounded-md bg-indigo py-2 text-sm font-bold text-white"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
