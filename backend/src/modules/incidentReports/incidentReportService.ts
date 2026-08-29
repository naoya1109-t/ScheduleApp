import type { OperationLogRepository } from "../logs/types.js"
import type {
  CreateIncidentReportInput,
  CustomerMasterEntry,
  CustomerMasterRepository,
  IncidentReport,
  IncidentReportListFilter,
  IncidentReportRepository,
  UpdateIncidentReportInput,
} from "./types.js"

export class IncidentReportService {
  constructor(
    private readonly repository: IncidentReportRepository,
    private readonly customerMasterRepository: CustomerMasterRepository,
    private readonly operationLog: OperationLogRepository,
  ) {}

  async searchCustomers(query: string): Promise<CustomerMasterEntry[]> {
    return this.customerMasterRepository.search(query)
  }

  async listReports(filter: IncidentReportListFilter): Promise<IncidentReport[]> {
    return this.repository.list(filter)
  }

  async getReport(reportId: number): Promise<IncidentReport | undefined> {
    return this.repository.findById(reportId)
  }

  async createReport(input: CreateIncidentReportInput, actorId: number): Promise<IncidentReport> {
    const created = await this.repository.create({ ...input, reporterId: actorId })
    await this.operationLog.record({
      actorId,
      targetType: "incident_report",
      targetId: String(created.reportId),
      action: "create",
    })
    return created
  }

  async updateReport(reportId: number, input: UpdateIncidentReportInput, actorId: number): Promise<IncidentReport> {
    const updated = await this.repository.update(reportId, input)
    await this.operationLog.record({
      actorId,
      targetType: "incident_report",
      targetId: String(reportId),
      action: "update",
    })
    return updated
  }

  async markChecked(reportId: number, actorId: number): Promise<IncidentReport> {
    const updated = await this.repository.markChecked(reportId, actorId)
    await this.operationLog.record({
      actorId,
      targetType: "incident_report",
      targetId: String(reportId),
      action: "check",
    })
    return updated
  }

  async markNotified(reportId: number, actorId: number): Promise<IncidentReport> {
    const updated = await this.repository.markNotified(reportId, actorId)
    await this.operationLog.record({
      actorId,
      targetType: "incident_report",
      targetId: String(reportId),
      action: "notify",
    })
    return updated
  }
}
