import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
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
