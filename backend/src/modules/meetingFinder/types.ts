export type MeetingDurationMinutes = 30 | 60 | 90 | 120

export interface MeetingSearchInput {
  userIds: number[]
  durationMinutes: MeetingDurationMinutes
  from: string
  to: string
}

export interface MeetingCandidate {
  startAt: string
  endAt: string
}
