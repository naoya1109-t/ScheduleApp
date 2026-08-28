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
