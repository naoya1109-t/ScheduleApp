import { apiFetch } from "./client"

export interface MeetingCandidate {
  startAt: string
  endAt: string
}

export function searchMeetingCandidates(input: {
  userIds: number[]
  durationMinutes: 30 | 60 | 90 | 120
  from: string
  to: string
}): Promise<MeetingCandidate[]> {
  return apiFetch<MeetingCandidate[]>("/api/meeting-finder/search", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
