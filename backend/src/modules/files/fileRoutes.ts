import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { Router } from "express"
import multer from "multer"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { HttpError } from "../../middleware/httpError.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { FileService } from "./fileService.js"

export function createFileRoutes(fileService: FileService, storageDir: string): Router {
  const router = Router()
  const tempDir = join(storageDir, ".tmp")
  mkdirSync(tempDir, { recursive: true })
  const upload = multer({ dest: tempDir, limits: { fileSize: 100 * 1024 * 1024 } })

  router.use(requireAuth)

  router.get(
    "/folders",
    asyncHandler(async (req, res) => {
      const parentFolderId = req.query.parentFolderId ? Number(req.query.parentFolderId) : null
      res.json(await fileService.listFolders(parentFolderId))
    }),
  )

  router.post(
    "/folders",
    asyncHandler(async (req, res) => {
      const { name, parentFolderId } = req.body
      if (!name) {
        res.status(400).json({ message: "name は必須です" })
        return
      }
      const created = await fileService.createFolder(name, parentFolderId ?? null)
      res.status(201).json(created)
    }),
  )

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      if (req.query.recent) {
        const limit = Number(req.query.recent)
        res.json(await fileService.listRecentFiles(limit))
        return
      }
      const folderId = Number(req.query.folderId)
      if (!folderId) {
        res.status(400).json({ message: "folderId は必須です" })
        return
      }
      res.json(await fileService.listFiles(folderId))
    }),
  )

  router.get(
    "/by-slug/:slug",
    asyncHandler(async (req, res) => {
      const file = await fileService.getFileBySlug(req.params.slug)
      if (!file) {
        res.status(404).json({ message: "ファイルが見つかりません" })
        return
      }
      res.json(file)
    }),
  )

  router.get(
    "/:fileId",
    asyncHandler(async (req, res) => {
      const file = await fileService.getFile(Number(req.params.fileId))
      if (!file) {
        res.status(404).json({ message: "ファイルが見つかりません" })
        return
      }
      res.json(file)
    }),
  )

  router.get(
    "/:fileId/download",
    asyncHandler(async (req, res) => {
      const file = await fileService.getFile(Number(req.params.fileId))
      if (!file) {
        res.status(404).json({ message: "ファイルが見つかりません" })
        return
      }
      res.download(file.currentPath, file.fileName)
    }),
  )

  router.post(
    "/upload",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      const folderId = Number(req.body.folderId)
      if (!folderId || !req.file) {
        throw new HttpError(400, "folderId, file は必須です")
      }
      const created = await fileService.uploadNewFile(
        folderId,
        req.file.originalname,
        req.file.path,
        req.session.userId!,
      )
      res.status(201).json(created)
    }),
  )

  router.post(
    "/:fileId/versions",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new HttpError(400, "file は必須です")
      }
      const updated = await fileService.uploadNewVersion(
        Number(req.params.fileId),
        req.file.path,
        req.file.originalname,
        req.session.userId!,
      )
      res.json(updated)
    }),
  )

  router.delete(
    "/:fileId",
    asyncHandler(async (req, res) => {
      await fileService.deleteFile(Number(req.params.fileId), req.session.userId!)
      res.status(204).end()
    }),
  )

  return router
}
