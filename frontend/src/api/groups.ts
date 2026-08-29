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

export function createGroup(name: string): Promise<Group> {
  return apiFetch<Group>("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function updateGroup(groupId: number, name: string): Promise<Group> {
  return apiFetch<Group>(`/api/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}

export function deleteGroup(groupId: number): Promise<void> {
  return apiFetch<void>(`/api/groups/${groupId}`, { method: "DELETE" })
}

export interface GroupMember {
  userId: number
  name: string
  displayOrder: number | null
}

export function listGroupMembers(groupId: number): Promise<GroupMember[]> {
  return apiFetch<GroupMember[]>(`/api/groups/${groupId}/members`)
}

export function addGroupMember(groupId: number, userId: number): Promise<GroupMember[]> {
  return apiFetch<GroupMember[]>(`/api/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  })
}

export function removeGroupMember(groupId: number, userId: number): Promise<GroupMember[]> {
  return apiFetch<GroupMember[]>(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" })
}

export function updateGroupMemberOrder(
  groupId: number,
  orders: { userId: number; displayOrder: number }[],
): Promise<GroupMember[]> {
  return apiFetch<GroupMember[]>(`/api/groups/${groupId}/member-order`, {
    method: "PUT",
    body: JSON.stringify({ orders }),
  })
}
