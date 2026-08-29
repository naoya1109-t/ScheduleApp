import { apiFetch } from "./client"

export interface JobTitle {
  jobTitleId: number
  name: string
}

export function listJobTitles(): Promise<JobTitle[]> {
  return apiFetch<JobTitle[]>("/api/job-titles")
}

export function createJobTitle(name: string): Promise<JobTitle> {
  return apiFetch<JobTitle>("/api/job-titles", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function updateJobTitle(jobTitleId: number, name: string): Promise<JobTitle> {
  return apiFetch<JobTitle>(`/api/job-titles/${jobTitleId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}

export function deleteJobTitle(jobTitleId: number): Promise<void> {
  return apiFetch<void>(`/api/job-titles/${jobTitleId}`, { method: "DELETE" })
}
