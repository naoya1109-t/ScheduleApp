import { useState } from "react"
import type { Group, GroupMember } from "../api/groups"

export interface GroupedMembers {
  group: Group
  members: GroupMember[]
}

export function UserPickerModal({
  groupedMembers,
  selectedUserIds,
  selectedGroupIds,
  onToggleUser,
  onToggleGroupSelection,
  onClose,
}: {
  groupedMembers: GroupedMembers[]
  selectedUserIds: number[]
  selectedGroupIds: number[]
  onToggleUser: (userId: number) => void
  onToggleGroupSelection: (groupId: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [activeGroupId, setActiveGroupId] = useState<number | null>(
    groupedMembers[0]?.group.groupId ?? null,
  )
  const normalizedQuery = query.trim()
  const isSearching = normalizedQuery.length > 0

  const visibleGroups = isSearching
    ? groupedMembers
        .map(({ group, members }) => ({
          group,
          members: members.filter((member) => member.name.includes(normalizedQuery)),
        }))
        .filter(({ group, members }) => members.length > 0 || group.name.includes(normalizedQuery))
    : groupedMembers.filter(({ group }) => group.groupId === activeGroupId)

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
          className="mb-2 rounded-md border border-border px-3 py-2 text-sm"
          placeholder="名前・グループ名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {!isSearching && groupedMembers.length > 0 && (
          <select
            className="mb-3 rounded-md border border-border px-3 py-2 text-sm"
            value={activeGroupId ?? ""}
            onChange={(e) => setActiveGroupId(e.target.value ? Number(e.target.value) : null)}
          >
            {groupedMembers.map(({ group }) => (
              <option key={group.groupId} value={group.groupId}>
                {group.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex-1 overflow-y-auto">
          {visibleGroups.map(({ group, members }) => {
            const isGroupSelected = selectedGroupIds.includes(group.groupId)
            return (
              <div key={group.groupId} className="mb-3">
                {isSearching && (
                  <div className="mb-1 text-[10.5px] font-bold text-text-soft">{group.name}</div>
                )}
                <label className="mb-1 flex items-center gap-2 rounded-md bg-surface-alt px-2 py-1.5 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={isGroupSelected}
                    onChange={() => onToggleGroupSelection(group.groupId)}
                  />
                  {group.name}(グループ全体)
                </label>
                <div className="flex flex-col gap-0.5">
                  {members.map((member) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-2 rounded-md px-2 py-1 pl-6 text-sm hover:bg-surface-alt"
                    >
                      <input
                        type="checkbox"
                        checked={isGroupSelected || selectedUserIds.includes(member.userId)}
                        disabled={isGroupSelected}
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
            <p className="text-[12.5px] text-text-soft">該当する利用者・グループがいません。</p>
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
