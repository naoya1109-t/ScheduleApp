import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { RoomService } from "./roomService.js"

export function createRoomRoutes(roomService: RoomService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json(await roomService.listRooms())
    }),
  )

  router.post(
    "/",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { name, memo } = req.body
      if (!name) {
        res.status(400).json({ message: "name は必須です" })
        return
      }
      const created = await roomService.createRoom({
        name,
        memo: memo ?? null,
      })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/order",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { orders } = req.body
      if (!Array.isArray(orders)) {
        res.status(400).json({ message: "orders は必須です" })
        return
      }
      const updated = await roomService.updateRoomOrder(orders)
      res.json(updated)
    }),
  )

  router.put(
    "/:roomId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const roomId = Number(req.params.roomId)
      const { name, memo } = req.body
      const updated = await roomService.updateRoom(roomId, { name, memo })
      res.json(updated)
    }),
  )

  router.delete(
    "/:roomId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const roomId = Number(req.params.roomId)
      await roomService.deleteRoom(roomId)
      res.status(204).end()
    }),
  )

  router.get(
    "/reservations",
    asyncHandler(async (req, res) => {
      const from = String(req.query.from)
      const to = String(req.query.to)
      if (!from || !to || from === "undefined" || to === "undefined") {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      const roomId = req.query.roomId ? Number(req.query.roomId) : null
      res.json(await roomService.listReservations(roomId, from, to))
    }),
  )

  router.post(
    "/reservations",
    asyncHandler(async (req, res) => {
      const { roomId, title, startAt, endAt } = req.body
      if (!roomId || !title || !startAt || !endAt) {
        res.status(400).json({ message: "roomId, title, startAt, endAt は必須です" })
        return
      }
      const created = await roomService.createReservation({
        roomId,
        reserverId: req.session.userId!,
        title,
        startAt,
        endAt,
      })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/reservations/:reservationId",
    asyncHandler(async (req, res) => {
      const reservationId = Number(req.params.reservationId)
      const { startAt, endAt } = req.body
      const updated = await roomService.updateReservation(
        reservationId,
        req.session.userId!,
        req.session.role!,
        { startAt, endAt },
      )
      res.json(updated)
    }),
  )

  router.delete(
    "/reservations/:reservationId",
    asyncHandler(async (req, res) => {
      const reservationId = Number(req.params.reservationId)
      await roomService.deleteReservation(reservationId, req.session.userId!, req.session.role!)
      res.status(204).end()
    }),
  )

  return router
}
