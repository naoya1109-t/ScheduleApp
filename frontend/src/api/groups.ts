import { apiFetch } from "./client"

export interface Group {
  groupId: number
  name: string
}

export function listGroups(): Promise<Group[]> {
  return apiFetch<Group[]>("/api/groups")
}

export function listMyGroups(): Promise<Group[]> {
  return apiFetch<Group[]>("/api/groups/mine")
}

export interface GroupMember {
  userId: number
  name: string
  displayOrder: number | null
}

export function listGroupMembers(groupId: number): Promise<GroupMember[]> {
  return apiFetch<GroupMember[]>(`/api/groups/${groupId}/members`)
}
