import { apiFetch } from "./client"

export type CheckStatus = "pending" | "checked"

export interface IncidentReport {
  reportId: number
  customerCode: string
  customerName: string | null
  salesRepId: number
  salesRepName: string
  reporterId: number
  reporterName: string
  productName: string | null
  customerInfo: string | null
  incidentCategory: string | null
  incidentContent: string | null
  responseStatus: string | null
  actionTaken: string | null
  description: string | null
  returnWarehouse: string | null
  checkStatus: CheckStatus
  checkedBy: number | null
  checkedAt: string | null
  notifiedBy: number | null
  notifiedAt: string | null
  occurredAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateIncidentReportInput {
  customerCode: string
  customerName: string | null
  salesRepId: number
  productName: string | null
  customerInfo: string | null
  incidentCategory: string | null
  incidentContent: string | null
  responseStatus: string | null
  actionTaken: string | null
  description: string | null
  returnWarehouse: string | null
  occurredAt: string
}

export function listIncidentReports(filter: { salesRepId?: number }): Promise<IncidentReport[]> {
  const params = new URLSearchParams()
  if (filter.salesRepId !== undefined) params.set("salesRepId", String(filter.salesRepId))
  const query = params.toString()
  return apiFetch<IncidentReport[]>(`/api/incident-reports${query ? `?${query}` : ""}`)
}

export function getIncidentReport(reportId: number): Promise<IncidentReport> {
  return apiFetch<IncidentReport>(`/api/incident-reports/${reportId}`)
}

export function createIncidentReport(input: CreateIncidentReportInput): Promise<IncidentReport> {
  return apiFetch<IncidentReport>("/api/incident-reports", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function markChecked(reportId: number): Promise<IncidentReport> {
  return apiFetch<IncidentReport>(`/api/incident-reports/${reportId}/check`, { method: "POST" })
}

export function markNotified(reportId: number): Promise<IncidentReport> {
  return apiFetch<IncidentReport>(`/api/incident-reports/${reportId}/notify`, { method: "POST" })
}
