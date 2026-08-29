import { apiFetch } from "./client"

export interface DirectoryUser {
  userId: number
  name: string
}

export function listUserDirectory(): Promise<DirectoryUser[]> {
  return apiFetch<DirectoryUser[]>("/api/users")
}
