import type { VisibleOccurrence } from "../calendar/types.js"

export interface TopPageSettings {
  boardDisplayCount: number
  fileDisplayCount: number
}

export interface TopPageSettingsRepository {
  get(): Promise<TopPageSettings>
}

export interface WeekGanttRow {
  userId: number
  name: string
  isSelf: boolean
  occurrences: VisibleOccurrence[]
}
