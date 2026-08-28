import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
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

  router.get(
    "/:groupId/members",
    asyncHandler(async (req, res) => {
      const groupId = Number(req.params.groupId)
      res.json(await groupRepository.listMembersOrdered(groupId))
    }),
  )

  return router
}
