import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { UserService } from "./userService.js"

export function createUserRoutes(userService: UserService): Router {
  const router = Router()

  router.use(requireAuth, requireAdmin)

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const users = await userService.listUsers()
      res.json(users)
    }),
  )

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const { loginId, password, name, email, employeeNo, role, groupIds } = req.body
      if (!loginId || !password || !name || !role) {
        res.status(400).json({ message: "loginId, password, name, role は必須です" })
        return
      }
      const created = await userService.createUser({
        loginId,
        password,
        name,
        email,
        employeeNo,
        role,
        groupIds: groupIds ?? [],
      })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/:userId",
    asyncHandler(async (req, res) => {
      const userId = Number(req.params.userId)
      const { name, email, employeeNo, role, groupIds } = req.body
      const updated = await userService.updateUser(userId, { name, email, employeeNo, role, groupIds })
      res.json(updated)
    }),
  )

  router.post(
    "/:userId/retire",
    asyncHandler(async (req, res) => {
      const userId = Number(req.params.userId)
      await userService.retireUser(userId)
      res.status(204).end()
    }),
  )

  router.post(
    "/:userId/reactivate",
    asyncHandler(async (req, res) => {
      const userId = Number(req.params.userId)
      await userService.reactivateUser(userId)
      res.status(204).end()
    }),
  )

  return router
}
