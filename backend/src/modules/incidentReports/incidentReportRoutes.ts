import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { IncidentReportService } from "./incidentReportService.js"

export function createIncidentReportRoutes(service: IncidentReportService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/customers",
    asyncHandler(async (req, res) => {
      const query = String(req.query.query ?? "")
      res.json(await service.searchCustomers(query))
    }),
  )

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const salesRepId = req.query.salesRepId ? Number(req.query.salesRepId) : undefined
      const customerCode = req.query.customerCode ? String(req.query.customerCode) : undefined
      res.json(await service.listReports({ salesRepId, customerCode }))
    }),
  )

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const {
        customerCode,
        customerName,
        salesRepId,
        productName,
        customerInfo,
        incidentCategory,
        incidentContent,
        responseStatus,
        actionTaken,
        description,
        returnWarehouse,
        occurredAt,
      } = req.body
      if (!customerCode || !salesRepId || !occurredAt) {
        res.status(400).json({ message: "customerCode, salesRepId, occurredAt は必須です" })
        return
      }
      const created = await service.createReport(
        {
          customerCode,
          customerName: customerName ?? null,
          salesRepId,
          productName: productName ?? null,
          customerInfo: customerInfo ?? null,
          incidentCategory: incidentCategory ?? null,
          incidentContent: incidentContent ?? null,
          responseStatus: responseStatus ?? null,
          actionTaken: actionTaken ?? null,
          description: description ?? null,
          returnWarehouse: returnWarehouse ?? null,
          occurredAt,
        },
        req.session.userId!,
      )
      res.status(201).json(created)
    }),
  )

  router.get(
    "/:reportId",
    asyncHandler(async (req, res) => {
      const report = await service.getReport(Number(req.params.reportId))
      if (!report) {
        res.status(404).json({ message: "事故報告が見つかりません" })
        return
      }
      res.json(report)
    }),
  )

  router.put(
    "/:reportId",
    asyncHandler(async (req, res) => {
      const reportId = Number(req.params.reportId)
      const updated = await service.updateReport(reportId, req.body, req.session.userId!)
      res.json(updated)
    }),
  )

  router.post(
    "/:reportId/check",
    asyncHandler(async (req, res) => {
      const reportId = Number(req.params.reportId)
      const updated = await service.markChecked(reportId, req.session.userId!)
      res.json(updated)
    }),
  )

  router.post(
    "/:reportId/notify",
    asyncHandler(async (req, res) => {
      const reportId = Number(req.params.reportId)
      const updated = await service.markNotified(reportId, req.session.userId!)
      res.json(updated)
    }),
  )

  return router
}
