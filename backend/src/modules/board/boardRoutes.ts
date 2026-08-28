import { Router } from "express"
import { asyncHandler } from "../../middleware/asyncHandler.js"
import { requireAuth } from "../../middleware/requireAuth.js"
import type { PostService } from "./postService.js"

export function createBoardRoutes(postService: PostService): Router {
  const router = Router()

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
      const { title, bodyHtml, visibilityScope, groupId } = req.body
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
      const { title, bodyHtml, visibilityScope, groupId } = req.body
      const updated = await postService.updatePost(postId, req.session.userId!, {
        title,
        bodyHtml,
        visibilityScope,
        groupId,
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

  return router
}
