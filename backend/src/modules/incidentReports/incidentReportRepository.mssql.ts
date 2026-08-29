import type { ConnectionPool } from "mssql"
import type {
  CheckStatus,
  CreateIncidentReportInput,
  IncidentReport,
  IncidentReportListFilter,
  IncidentReportRepository,
  UpdateIncidentReportInput,
} from "./types.js"

interface ReportRow {
  report_id: number
  customer_code: string
  customer_name: string | null
  sales_rep_id: number
  sales_rep_name: string
  reporter_id: number
  reporter_name: string
  product_name: string | null
  customer_info: string | null
  incident_category: string | null
  incident_content: string | null
  response_status: string | null
  action_taken: string | null
  description: string | null
  return_warehouse: string | null
  check_status: CheckStatus
  checked_by: number | null
  checked_at: string | null
  notified_by: number | null
  notified_at: string | null
  occurred_at: string
  created_at: string
  updated_at: string
}

function toReport(row: ReportRow): IncidentReport {
  return {
    reportId: row.report_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    salesRepId: row.sales_rep_id,
    salesRepName: row.sales_rep_name,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    productName: row.product_name,
    customerInfo: row.customer_info,
    incidentCategory: row.incident_category,
    incidentContent: row.incident_content,
    responseStatus: row.response_status,
    actionTaken: row.action_taken,
    description: row.description,
    returnWarehouse: row.return_warehouse,
    checkStatus: row.check_status,
    checkedBy: row.checked_by,
    checkedAt: row.checked_at,
    notifiedBy: row.notified_by,
    notifiedAt: row.notified_at,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const REPORT_SELECT = `
  SELECT r.report_id, r.customer_code, r.customer_name, r.sales_rep_id,
         sales_rep.name AS sales_rep_name, r.reporter_id, reporter.name AS reporter_name,
         r.product_name, r.customer_info, r.incident_category, r.incident_content,
         r.response_status, r.action_taken, r.description, r.return_warehouse,
         r.check_status, r.checked_by, r.checked_at, r.notified_by, r.notified_at,
         r.occurred_at, r.created_at, r.updated_at
  FROM incident_report r
  JOIN app_user sales_rep ON sales_rep.user_id = r.sales_rep_id
  JOIN app_user reporter ON reporter.user_id = r.reporter_id
`

export class MssqlIncidentReportRepository implements IncidentReportRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async list(filter: IncidentReportListFilter): Promise<IncidentReport[]> {
    const pool = await this.getPool()
    const request = pool.request()
    const conditions: string[] = []
    if (filter.salesRepId !== undefined) {
      request.input("salesRepId", filter.salesRepId)
      conditions.push("r.sales_rep_id = @salesRepId")
    }
    if (filter.customerCode !== undefined) {
      request.input("customerCode", filter.customerCode)
      conditions.push("r.customer_code = @customerCode")
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const result = await request.query<ReportRow>(`${REPORT_SELECT} ${where} ORDER BY r.occurred_at DESC`)
    return result.recordset.map(toReport)
  }

  async findById(reportId: number): Promise<IncidentReport | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("reportId", reportId)
      .query<ReportRow>(`${REPORT_SELECT} WHERE r.report_id = @reportId`)
    const row = result.recordset[0]
    return row ? toReport(row) : undefined
  }

  async create(input: CreateIncidentReportInput & { reporterId: number }): Promise<IncidentReport> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("customerCode", input.customerCode)
      .input("customerName", input.customerName)
      .input("salesRepId", input.salesRepId)
      .input("reporterId", input.reporterId)
      .input("productName", input.productName)
      .input("customerInfo", input.customerInfo)
      .input("incidentCategory", input.incidentCategory)
      .input("incidentContent", input.incidentContent)
      .input("responseStatus", input.responseStatus)
      .input("actionTaken", input.actionTaken)
      .input("description", input.description)
      .input("returnWarehouse", input.returnWarehouse)
      .input("occurredAt", input.occurredAt).query<{ report_id: number }>(`
        INSERT INTO incident_report (
          customer_code, customer_name, sales_rep_id, reporter_id, product_name,
          customer_info, incident_category, incident_content, response_status,
          action_taken, description, return_warehouse, occurred_at
        )
        OUTPUT inserted.report_id
        VALUES (
          @customerCode, @customerName, @salesRepId, @reporterId, @productName,
          @customerInfo, @incidentCategory, @incidentContent, @responseStatus,
          @actionTaken, @description, @returnWarehouse, @occurredAt
        )
      `)
    const created = await this.findById(result.recordset[0].report_id)
    if (!created) {
      throw new Error("事故報告の作成に失敗しました")
    }
    return created
  }

  async update(reportId: number, input: UpdateIncidentReportInput): Promise<IncidentReport> {
    const pool = await this.getPool()
    const request = pool.request().input("reportId", reportId)
    const assignments: string[] = ["updated_at = SYSUTCDATETIME()"]
    const fieldMap: Record<string, unknown> = {
      productName: input.productName,
      customerInfo: input.customerInfo,
      incidentCategory: input.incidentCategory,
      incidentContent: input.incidentContent,
      responseStatus: input.responseStatus,
      actionTaken: input.actionTaken,
      description: input.description,
      returnWarehouse: input.returnWarehouse,
    }
    const columnMap: Record<string, string> = {
      productName: "product_name",
      customerInfo: "customer_info",
      incidentCategory: "incident_category",
      incidentContent: "incident_content",
      responseStatus: "response_status",
      actionTaken: "action_taken",
      description: "description",
      returnWarehouse: "return_warehouse",
    }
    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        request.input(key, value)
        assignments.push(`${columnMap[key]} = @${key}`)
      }
    }
    if (assignments.length > 1) {
      await request.query(`UPDATE incident_report SET ${assignments.join(", ")} WHERE report_id = @reportId`)
    }
    const updated = await this.findById(reportId)
    if (!updated) {
      throw new Error("事故報告が見つかりません")
    }
    return updated
  }

  async markChecked(reportId: number, checkedBy: number): Promise<IncidentReport> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("reportId", reportId)
      .input("checkedBy", checkedBy)
      .query(
        "UPDATE incident_report SET check_status = 'checked', checked_by = @checkedBy, checked_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME() WHERE report_id = @reportId",
      )
    const updated = await this.findById(reportId)
    if (!updated) {
      throw new Error("事故報告が見つかりません")
    }
    return updated
  }

  async markNotified(reportId: number, notifiedBy: number): Promise<IncidentReport> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("reportId", reportId)
      .input("notifiedBy", notifiedBy)
      .query(
        "UPDATE incident_report SET notified_by = @notifiedBy, notified_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME() WHERE report_id = @reportId",
      )
    const updated = await this.findById(reportId)
    if (!updated) {
      throw new Error("事故報告が見つかりません")
    }
    return updated
  }
}
