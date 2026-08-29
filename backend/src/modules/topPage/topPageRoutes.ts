import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { TopPageService } from "./topPageService.js"

export function createTopPageRoutes(topPageService: TopPageService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/settings",
    asyncHandler(async (_req, res) => {
      res.json(await topPageService.getSettings())
    }),
  )

  router.put(
    "/settings",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { boardDisplayCount, fileDisplayCount } = req.body
      if (!Number.isInteger(boardDisplayCount) || !Number.isInteger(fileDisplayCount)) {
        res.status(400).json({ message: "boardDisplayCount, fileDisplayCount は整数で指定してください" })
        return
      }
      res.json(await topPageService.updateSettings({ boardDisplayCount, fileDisplayCount }))
    }),
  )

  router.get(
    "/week-gantt",
    asyncHandler(async (req, res) => {
      const from = String(req.query.from)
      const to = String(req.query.to)
      if (!from || !to || from === "undefined" || to === "undefined") {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      const groupId = req.query.groupId ? Number(req.query.groupId) : null
      const rows = await topPageService.getWeekGantt(req.session.userId!, groupId, from, to)
      res.json(rows)
    }),
  )

  return router
}
