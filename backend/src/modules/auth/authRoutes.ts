import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import type { UserRepository } from "../users/types.js"
import type { AuthService } from "./authService.js"

export function createAuthRoutes(authService: AuthService, userRepository: UserRepository): Router {
  const router = Router()

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const { loginId, password } = req.body
      if (!loginId || !password) {
        res.status(400).json({ message: "loginId, password は必須です" })
        return
      }
      const user = await authService.verifyCredentials(loginId, password)
      if (!user) {
        res.status(401).json({ message: "ログインIDまたはパスワードが正しくありません" })
        return
      }
      req.session.userId = user.userId
      req.session.role = user.role
      res.json({ userId: user.userId, name: user.name, role: user.role })
    }),
  )

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(204).end()
    })
  })

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      if (!req.session.userId) {
        res.status(401).json({ message: "未ログインです" })
        return
      }
      const user = await userRepository.findById(req.session.userId)
      if (!user || user.status !== "active") {
        req.session.destroy(() => undefined)
        res.status(401).json({ message: "未ログインです" })
        return
      }
      res.json({ userId: user.userId, name: user.name, role: user.role })
    }),
  )

  return router
}
