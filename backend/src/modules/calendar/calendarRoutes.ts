import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { CalendarService } from "./calendarService.js"

export function createCalendarRoutes(calendarService: CalendarService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/events",
    asyncHandler(async (req, res) => {
      const ownerId = Number(req.query.ownerId ?? req.session.userId)
      const from = String(req.query.from)
      const to = String(req.query.to)
      if (!from || !to || from === "undefined" || to === "undefined") {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      const events = await calendarService.listVisibleEvents(ownerId, req.session.userId!, from, to)
      res.json(events)
    }),
  )

  router.post(
    "/events",
    asyncHandler(async (req, res) => {
      const { title, startAt, endAt, visibility, isHidden, isRecurring, recurrenceRule } = req.body
      if (!title || !startAt || !endAt || !visibility) {
        res.status(400).json({ message: "title, startAt, endAt, visibility は必須です" })
        return
      }
      const created = await calendarService.createEvent({
        ownerId: req.session.userId!,
        title,
        startAt,
        endAt,
        visibility,
        isHidden: Boolean(isHidden),
        isRecurring: Boolean(isRecurring),
        recurrenceRule: isRecurring ? (recurrenceRule ?? "daily") : "none",
      })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/events/:eventId",
    asyncHandler(async (req, res) => {
      const eventId = Number(req.params.eventId)
      const { title, startAt, endAt, visibility, isHidden, isRecurring, recurrenceRule } = req.body
      const updated = await calendarService.updateEvent(eventId, req.session.userId!, {
        title,
        startAt,
        endAt,
        visibility,
        isHidden,
        isRecurring,
        recurrenceRule,
      })
      res.json(updated)
    }),
  )

  router.delete(
    "/events/:eventId",
    asyncHandler(async (req, res) => {
      const eventId = Number(req.params.eventId)
      await calendarService.deleteEvent(eventId, req.session.userId!)
      res.status(204).end()
    }),
  )

  return router
}
