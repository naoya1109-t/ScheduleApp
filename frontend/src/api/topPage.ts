import { apiFetch } from "./client"
import type { VisibleOccurrence } from "./calendar"

export interface TopPageSettings {
  boardDisplayCount: number
  fileDisplayCount: number
}

export interface WeekGanttRow {
  userId: number
  name: string
  isSelf: boolean
  occurrences: VisibleOccurrence[]
}

export function getTopPageSettings(): Promise<TopPageSettings> {
  return apiFetch<TopPageSettings>("/api/top-page/settings")
}

export function getWeekGantt(groupId: number | null, from: string, to: string): Promise<WeekGanttRow[]> {
  const params = new URLSearchParams({ from, to })
  if (groupId !== null) {
    params.set("groupId", String(groupId))
  }
  return apiFetch<WeekGanttRow[]>(`/api/top-page/week-gantt?${params.toString()}`)
}
