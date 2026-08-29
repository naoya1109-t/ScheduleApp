import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { GroupRepository } from "./types.js"

export function createGroupRoutes(groupRepository: GroupRepository): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json(await groupRepository.listAll())
    }),
  )

  router.get(
    "/mine",
    asyncHandler(async (req, res) => {
      res.json(await groupRepository.listGroupsForUser(req.session.userId!))
    }),
  )

  router.post(
    "/",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { name } = req.body
      if (!name) {
        res.status(400).json({ message: "name は必須です" })
        return
      }
      const created = await groupRepository.create({ name })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/:groupId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      const { name } = req.body
      if (!name) {
        res.status(400).json({ message: "name は必須です" })
        return
      }
      const updated = await groupRepository.update(groupId, { name })
      res.json(updated)
    }),
  )

  router.delete(
    "/:groupId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      await groupRepository.delete(groupId)
      res.status(204).end()
    }),
  )

  router.get(
    "/:groupId/members",
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      res.json(await groupRepository.listMembersOrdered(groupId))
    }),
  )

  router.post(
    "/:groupId/members",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      const { userId } = req.body
      if (!userId) {
        res.status(400).json({ message: "userId は必須です" })
        return
      }
      await groupRepository.addMember(groupId, userId)
      res.status(201).json(await groupRepository.listMembersOrdered(groupId))
    }),
  )

  router.delete(
    "/:groupId/members/:userId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      const userId = Number(req.params.userId)
      await groupRepository.removeMember(groupId, userId)
      res.json(await groupRepository.listMembersOrdered(groupId))
    }),
  )

  router.put(
    "/:groupId/member-order",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      const { orders } = req.body
      if (!Array.isArray(orders)) {
        res.status(400).json({ message: "orders は配列で指定してください" })
        return
      }
      await groupRepository.setMemberOrder(groupId, orders)
      res.json(await groupRepository.listMembersOrdered(groupId))
    }),
  )

  return router
}
