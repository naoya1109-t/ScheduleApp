import { apiFetch } from "./client"

export type UserRole = "admin" | "general"
export type UserStatus = "active" | "retired"

export interface UserSummary {
  userId: number
  loginId: string
  name: string
  email: string | null
  employeeNo: string | null
  role: UserRole
  status: UserStatus
  jobTitleId: number | null
}

export interface CreateUserInput {
  loginId: string
  password: string
  name: string
  email?: string
  employeeNo?: string
  role: UserRole
  groupIds: number[]
  jobTitleId?: number | null
}

export interface UpdateUserInput {
  name?: string
  email?: string | null
  employeeNo?: string | null
  role?: UserRole
  groupIds?: number[]
  jobTitleId?: number | null
}

export function listUsers(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>("/api/admin/users")
}

export function createUser(input: CreateUserInput): Promise<UserSummary> {
  return apiFetch<UserSummary>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateUser(userId: number, input: UpdateUserInput): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function retireUser(userId: number): Promise<void> {
  return apiFetch<void>(`/api/admin/users/${userId}/retire`, { method: "POST" })
}

export function reactivateUser(userId: number): Promise<void> {
  return apiFetch<void>(`/api/admin/users/${userId}/reactivate`, { method: "POST" })
}
