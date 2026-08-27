import { apiFetch } from "./client"

export interface CurrentUser {
  userId: number
  name: string
  role: "admin" | "general"
}

export function login(loginId: string, password: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  })
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST" })
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/auth/me")
}
