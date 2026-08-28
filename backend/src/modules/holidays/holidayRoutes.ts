import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { HolidayService } from "./holidayService.js"

export function createHolidayRoutes(holidayService: HolidayService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      if (req.query.from && req.query.to) {
        const holidays = await holidayService.listInRange(String(req.query.from), String(req.query.to))
        res.json(holidays)
        return
      }
      const fiscalYear = Number(req.query.year ?? new Date().getFullYear())
      const holidays = await holidayService.listByYear(fiscalYear)
      res.json(holidays)
    }),
  )

  router.post(
    "/",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { holidayDate, name, fiscalYear } = req.body
      if (!holidayDate || !name || !fiscalYear) {
        res.status(400).json({ message: "holidayDate, name, fiscalYear は必須です" })
        return
      }
      const created = await holidayService.createHoliday({ holidayDate, name, fiscalYear })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/:holidayId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const holidayId = Number(req.params.holidayId)
      const updated = await holidayService.updateHoliday(holidayId, { name: req.body.name })
      res.json(updated)
    }),
  )

  router.delete(
    "/:holidayId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const holidayId = Number(req.params.holidayId)
      await holidayService.deleteHoliday(holidayId)
      res.status(204).end()
    }),
  )

  return router
}
