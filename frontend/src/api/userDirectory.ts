import { apiFetch } from "./client"

export interface DirectoryUser {
  userId: number
  name: string
}

export function listUserDirectory(): Promise<DirectoryUser[]> {
  return apiFetch<DirectoryUser[]>("/api/users")
}

export interface DirectoryUserDetail {
  userId: number
  name: string
  email: string | null
  employeeNo: string | null
  jobTitleId: number | null
}

export function getDirectoryUser(userId: number): Promise<DirectoryUserDetail> {
  return apiFetch<DirectoryUserDetail>(`/api/users/${userId}`)
}
