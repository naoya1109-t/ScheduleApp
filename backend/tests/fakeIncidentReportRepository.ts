import type {
  CreateIncidentReportInput,
  IncidentReport,
  IncidentReportListFilter,
  IncidentReportRepository,
  UpdateIncidentReportInput,
} from "../src/modules/incidentReports/types.js"

export class FakeIncidentReportRepository implements IncidentReportRepository {
  reports: IncidentReport[] = []
  userNames = new Map<number, string>()
  private nextId = 1

  setUserName(userId: number, name: string): void {
    this.userNames.set(userId, name)
  }

  async list(filter: IncidentReportListFilter): Promise<IncidentReport[]> {
    return this.reports.filter((report) => {
      if (filter.salesRepId !== undefined && report.salesRepId !== filter.salesRepId) return false
      if (filter.customerCode !== undefined && report.customerCode !== filter.customerCode) return false
      return true
    })
  }

  async findById(reportId: number): Promise<IncidentReport | undefined> {
    return this.reports.find((report) => report.reportId === reportId)
  }

  async create(input: CreateIncidentReportInput & { reporterId: number }): Promise<IncidentReport> {
    const now = new Date().toISOString()
    const report: IncidentReport = {
      reportId: this.nextId++,
      customerCode: input.customerCode,
      customerName: input.customerName,
      salesRepId: input.salesRepId,
      salesRepName: this.userNames.get(input.salesRepId) ?? "unknown",
      reporterId: input.reporterId,
      reporterName: this.userNames.get(input.reporterId) ?? "unknown",
      productName: input.productName,
      customerInfo: input.customerInfo,
      incidentCategory: input.incidentCategory,
      incidentContent: input.incidentContent,
      responseStatus: input.responseStatus,
      actionTaken: input.actionTaken,
      description: input.description,
      returnWarehouse: input.returnWarehouse,
      checkStatus: "pending",
      checkedBy: null,
      checkedAt: null,
      notifiedBy: null,
      notifiedAt: null,
      occurredAt: input.occurredAt,
      createdAt: now,
      updatedAt: now,
    }
    this.reports.push(report)
    return report
  }

  async update(reportId: number, input: UpdateIncidentReportInput): Promise<IncidentReport> {
    const report = this.reports.find((candidate) => candidate.reportId === reportId)
    if (!report) {
      throw new Error("事故報告が見つかりません")
    }
    Object.assign(report, input)
    report.updatedAt = new Date().toISOString()
    return report
  }

  async markChecked(reportId: number, checkedBy: number): Promise<IncidentReport> {
    const report = this.reports.find((candidate) => candidate.reportId === reportId)
    if (!report) {
      throw new Error("事故報告が見つかりません")
    }
    report.checkStatus = "checked"
    report.checkedBy = checkedBy
    report.checkedAt = new Date().toISOString()
    return report
  }

  async markNotified(reportId: number, notifiedBy: number): Promise<IncidentReport> {
    const report = this.reports.find((candidate) => candidate.reportId === reportId)
    if (!report) {
      throw new Error("事故報告が見つかりません")
    }
    report.notifiedBy = notifiedBy
    report.notifiedAt = new Date().toISOString()
    return report
  }
}
