import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { Router } from "express"
import multer from "multer"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { HttpError } from "../../middleware/httpError.js"
import { requireAdmin } from "../../middleware/requireAdmin.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { PostService } from "./postService.js"

export function createBoardRoutes(postService: PostService, storageDir: string): Router {
  const router = Router()
  const tempDir = join(storageDir, ".tmp")
  mkdirSync(tempDir, { recursive: true })
  const upload = multer({ dest: tempDir, limits: { fileSize: 100 * 1024 * 1024 } })

  router.use(requireAuth)

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const posts = await postService.listPosts(req.session.userId!)
      res.json(posts)
    }),
  )

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const { title, bodyHtml, visibilityScope, groupId, publishStartAt, publishEndAt } = req.body
      if (!title || !bodyHtml || !visibilityScope) {
        res.status(400).json({ message: "title, bodyHtml, visibilityScope は必須です" })
        return
      }
      const created = await postService.createPost({
        authorId: req.session.userId!,
        title,
        bodyHtml,
        visibilityScope,
        groupId: groupId ?? null,
        publishStartAt: publishStartAt ?? null,
        publishEndAt: publishEndAt ?? null,
      })
      res.status(201).json(created)
    }),
  )

  router.get(
    "/by-slug/:slug",
    asyncHandler(async (req, res) => {
      const post = await postService.getPostBySlug(req.params.slug)
      if (!post) {
        res.status(404).json({ message: "投稿が見つかりません" })
        return
      }
      res.json(post)
    }),
  )

  router.get(
    "/bulk-delete/preview",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const from = String(req.query.from)
      const to = String(req.query.to)
      if (!from || !to || from === "undefined" || to === "undefined") {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      res.json(await postService.previewBulkDelete(from, to))
    }),
  )

  router.post(
    "/bulk-delete",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { from, to } = req.body
      if (!from || !to) {
        res.status(400).json({ message: "from, to は必須です" })
        return
      }
      const result = await postService.executeBulkDelete(from, to, req.session.userId!)
      res.json(result)
    }),
  )

  router.get(
    "/attachments/:attachmentId/download",
    asyncHandler(async (req, res) => {
      const attachmentId = Number(req.params.attachmentId)
      const attachment = await postService.getAttachment(attachmentId)
      if (!attachment) {
        res.status(404).json({ message: "添付ファイルが見つかりません" })
        return
      }
      res.download(attachment.filePath, attachment.fileName)
    }),
  )

  router.get(
    "/:postId",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      const post = await postService.getPost(postId)
      if (!post) {
        res.status(404).json({ message: "投稿が見つかりません" })
        return
      }
      res.json(post)
    }),
  )

  router.put(
    "/:postId",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      const { title, bodyHtml, visibilityScope, groupId, publishStartAt, publishEndAt } = req.body
      const updated = await postService.updatePost(postId, req.session.userId!, {
        title,
        bodyHtml,
        visibilityScope,
        groupId,
        publishStartAt,
        publishEndAt,
      })
      res.json(updated)
    }),
  )

  router.delete(
    "/:postId",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      await postService.deletePost(postId, req.session.userId!)
      res.status(204).end()
    }),
  )

  router.get(
    "/:postId/comments",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      const comments = await postService.listComments(postId)
      res.json(comments)
    }),
  )

  router.post(
    "/:postId/comments",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      const { body } = req.body
      if (!body) {
        res.status(400).json({ message: "body は必須です" })
        return
      }
      const comment = await postService.addComment(postId, req.session.userId!, body)
      res.status(201).json(comment)
    }),
  )

  router.post(
    "/:postId/read",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      await postService.markRead(postId, req.session.userId!)
      res.status(204).end()
    }),
  )

  router.get(
    "/:postId/attachments",
    asyncHandler(async (req, res) => {
      const postId = Number(req.params.postId)
      res.json(await postService.listAttachments(postId))
    }),
  )

  router.post(
    "/:postId/attachments",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new HttpError(400, "file は必須です")
      }
      const postId = Number(req.params.postId)
      const attachment = await postService.addAttachment(
        postId,
        req.file.originalname,
        req.file.path,
        req.session.userId!,
      )
      res.status(201).json(attachment)
    }),
  )

  router.delete(
    "/attachments/:attachmentId",
    asyncHandler(async (req, res) => {
      const attachmentId = Number(req.params.attachmentId)
      await postService.deleteAttachment(attachmentId, req.session.userId!)
      res.status(204).end()
    }),
  )

  return router
}
