import { apiFetch } from "./client"

export interface Holiday {
  holidayId: number
  holidayDate: string
  name: string
  fiscalYear: number
}

export function listHolidaysByYear(fiscalYear: number): Promise<Holiday[]> {
  return apiFetch<Holiday[]>(`/api/holidays?year=${fiscalYear}`)
}

export function listHolidaysInRange(from: string, to: string): Promise<Holiday[]> {
  const params = new URLSearchParams({ from, to })
  return apiFetch<Holiday[]>(`/api/holidays?${params.toString()}`)
}

export function createHoliday(input: { holidayDate: string; name: string; fiscalYear: number }): Promise<Holiday> {
  return apiFetch<Holiday>("/api/holidays", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteHoliday(holidayId: number): Promise<void> {
  return apiFetch<void>(`/api/holidays/${holidayId}`, { method: "DELETE" })
}
