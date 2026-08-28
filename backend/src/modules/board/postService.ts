import { randomBytes } from "node:crypto"
import type { OperationLogRepository } from "../logs/types.js"
import { excerptHtml } from "./excerpt.js"
import { sanitizePostBody } from "./sanitize.js"
import type { Comment, CreatePostInput, Post, PostRepository, PostSummary, UpdatePostInput } from "./types.js"

const EXCERPT_LENGTH = 150

function generatePermalinkSlug(): string {
  return randomBytes(8).toString("hex")
}

export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly operationLog: OperationLogRepository,
  ) {}

  async listPosts(viewerId: number): Promise<PostSummary[]> {
    const rows = await this.repository.list(viewerId)
    return rows.map((row) => ({
      postId: row.postId,
      authorName: row.authorName,
      title: row.title,
      excerptHtml: excerptHtml(row.bodyHtml, EXCERPT_LENGTH),
      visibilityScope: row.visibilityScope,
      groupId: row.groupId,
      updatedAt: row.updatedAt,
      permalinkSlug: row.permalinkSlug,
      isRead: row.isRead,
    }))
  }

  async getPost(postId: number): Promise<Post | undefined> {
    return this.repository.findById(postId)
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return this.repository.findBySlug(slug)
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const created = await this.repository.create({
      ...input,
      bodyHtml: sanitizePostBody(input.bodyHtml),
      permalinkSlug: generatePermalinkSlug(),
    })
    await this.operationLog.record({
      actorId: input.authorId,
      targetType: "post",
      targetId: String(created.postId),
      action: "create",
    })
    return created
  }

  async updatePost(postId: number, actorId: number, input: UpdatePostInput): Promise<Post> {
    const updated = await this.repository.update(postId, {
      ...input,
      bodyHtml: input.bodyHtml !== undefined ? sanitizePostBody(input.bodyHtml) : undefined,
    })
    await this.operationLog.record({
      actorId,
      targetType: "post",
      targetId: String(postId),
      action: "update",
    })
    return updated
  }

  async deletePost(postId: number, actorId: number): Promise<void> {
    await this.repository.delete(postId)
    await this.operationLog.record({
      actorId,
      targetType: "post",
      targetId: String(postId),
      action: "delete",
    })
  }

  async listComments(postId: number): Promise<Comment[]> {
    return this.repository.listComments(postId)
  }

  async addComment(postId: number, authorId: number, body: string): Promise<Comment> {
    return this.repository.addComment(postId, authorId, body)
  }

  async markRead(postId: number, userId: number): Promise<void> {
    await this.repository.markRead(postId, userId)
  }
}
