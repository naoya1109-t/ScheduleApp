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

export interface UpdateIncidentReportInput {
  productName?: string | null
  customerInfo?: string | null
  incidentCategory?: string | null
  incidentContent?: string | null
  responseStatus?: string | null
  actionTaken?: string | null
  description?: string | null
  returnWarehouse?: string | null
}

export interface IncidentReportListFilter {
  salesRepId?: number
  customerCode?: string
}

export interface IncidentReportRepository {
  list(filter: IncidentReportListFilter): Promise<IncidentReport[]>
  findById(reportId: number): Promise<IncidentReport | undefined>
  create(input: CreateIncidentReportInput & { reporterId: number }): Promise<IncidentReport>
  update(reportId: number, input: UpdateIncidentReportInput): Promise<IncidentReport>
  markChecked(reportId: number, checkedBy: number): Promise<IncidentReport>
  markNotified(reportId: number, notifiedBy: number): Promise<IncidentReport>
}

export interface CustomerMasterEntry {
  customerCode: string
  customerName: string
  salesRepId: number | null
}

/** 得意先マスタは読み取り専用。実体は別サーバーだが、本アプリのDB上のビュー経由で参照する(design.md 3-2章) */
export interface CustomerMasterRepository {
  search(query: string): Promise<CustomerMasterEntry[]>
  findByCode(customerCode: string): Promise<CustomerMasterEntry | undefined>
}
