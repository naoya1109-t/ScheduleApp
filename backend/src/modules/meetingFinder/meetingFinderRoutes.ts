import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { MeetingDurationMinutes } from "./types.js"
import type { MeetingFinderService } from "./meetingFinderService.js"

const ALLOWED_DURATIONS: MeetingDurationMinutes[] = [30, 60, 90, 120]

export function createMeetingFinderRoutes(service: MeetingFinderService): Router {
  const router = Router()

  router.use(requireAuth)

  router.post(
    "/search",
    asyncHandler(async (req, res) => {
      const { userIds, durationMinutes, from, to } = req.body
      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ message: "userIds は1件以上必要です" })
        return
      }
      if (!ALLOWED_DURATIONS.includes(durationMinutes)) {
        res.status(400).json({ message: "durationMinutes は30/60/90/120のいずれかです" })
        return
      }
      if (!from || !to) {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      const candidates = await service.findCandidates({
        userIds: userIds.map(Number),
        durationMinutes,
        from,
        to,
      })
      res.json(candidates)
    }),
  )

  return router
}
