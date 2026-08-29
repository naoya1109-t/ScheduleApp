import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { JobTitleRepository } from "./types.js"

export function createJobTitleRoutes(jobTitleRepository: JobTitleRepository): Router {
  const router = Router()

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json(await jobTitleRepository.listAll())
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
      const created = await jobTitleRepository.create({ name })
      res.status(201).json(created)
    }),
  )

  router.put(
    "/:jobTitleId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const jobTitleId = Number(req.params.jobTitleId)
      const { name } = req.body
      if (!name) {
        res.status(400).json({ message: "name は必須です" })
        return
      }
      const updated = await jobTitleRepository.update(jobTitleId, { name })
      res.json(updated)
    }),
  )

  router.delete(
    "/:jobTitleId",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const jobTitleId = Number(req.params.jobTitleId)
      await jobTitleRepository.delete(jobTitleId)
      res.status(204).end()
    }),
  )

  return router
}
