import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { UserService } from "./userService.js"

/** 一般社員でも利用できる最小限の利用者ディレクトリ(担当営業選択等のプルダウン用) */
export function createDirectoryRoutes(userService: UserService): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json(await userService.listActiveDirectory())
    }),
  )

  return router
}
