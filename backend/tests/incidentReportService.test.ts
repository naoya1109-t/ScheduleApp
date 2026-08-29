import { describe, expect, it } from "vitest"
import { IncidentReportService } from "../src/modules/incidentReports/incidentReportService.js"
import { FakeCustomerMasterRepository } from "./fakeCustomerMasterRepository.js"
import { FakeIncidentReportRepository } from "./fakeIncidentReportRepository.js"
import { FakeOperationLogRepository } from "./fakeOperationLogRepository.js"

function setup() {
  const repository = new FakeIncidentReportRepository()
  const customerMasterRepository = new FakeCustomerMasterRepository()
  const operationLog = new FakeOperationLogRepository()
  const service = new IncidentReportService(repository, customerMasterRepository, operationLog)
  repository.setUserName(1, "事務員一郎")
  repository.setUserName(2, "営業花子")
  return { repository, customerMasterRepository, operationLog, service }
}

const baseInput = {
  customerCode: "C001",
  customerName: "アマゾンジャパン合同会社",
  salesRepId: 2,
  productName: "商品A",
  customerInfo: null,
  incidentCategory: "送り先間違い",
  incidentContent: "誤った住所に発送した",
  responseStatus: "再発送済み",
  actionTaken: "正しい送り先に再発送",
  description: null,
  returnWarehouse: null,
  occurredAt: "2026-08-26T09:00:00.000Z",
}

describe("IncidentReportService", () => {
  it("事故報告を作成すると入力者(ログインユーザー)が記録される", async () => {
    const { service } = setup()
    const created = await service.createReport(baseInput, 1)
    expect(created.reporterId).toBe(1)
    expect(created.reporterName).toBe("事務員一郎")
    expect(created.checkStatus).toBe("pending")
  })

  it("担当営業で一覧を絞り込める(営業が知らない事故も事後的に確認できる)", async () => {
    const { service } = setup()
    await service.createReport(baseInput, 1)
    await service.createReport({ ...baseInput, salesRepId: 3 }, 1)

    const filtered = await service.listReports({ salesRepId: 2 })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].salesRepId).toBe(2)
  })

  it("チェック状態を更新すると、チェック者・日時が記録され操作ログに残る", async () => {
    const { service, operationLog } = setup()
    const created = await service.createReport(baseInput, 1)

    const checked = await service.markChecked(created.reportId, 9)

    expect(checked.checkStatus).toBe("checked")
    expect(checked.checkedBy).toBe(9)
    expect(checked.checkedAt).not.toBeNull()
    expect(operationLog.records.map((r) => r.action)).toEqual(["create", "check"])
  })

  it("周知記録を残すと、周知担当者・日時が記録される", async () => {
    const { service } = setup()
    const created = await service.createReport(baseInput, 1)

    const notified = await service.markNotified(created.reportId, 5)

    expect(notified.notifiedBy).toBe(5)
    expect(notified.notifiedAt).not.toBeNull()
  })

  it("得意先マスタが未整備でも検索はエラーにならず空配列を返す", async () => {
    const { service } = setup()
    const result = await service.searchCustomers("アマゾン")
    expect(result).toEqual([])
  })

  it("作成・更新はすべて操作ログに記録される", async () => {
    const { service, operationLog } = setup()
    const created = await service.createReport(baseInput, 1)
    await service.updateReport(created.reportId, { responseStatus: "対応完了" }, 1)

    expect(operationLog.records.map((r) => r.action)).toEqual(["create", "update"])
    expect(operationLog.records.every((r) => r.targetType === "incident_report")).toBe(true)
  })
})
