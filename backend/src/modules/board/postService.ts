import { randomBytes, randomUUID } from "node:crypto"
import { mkdir, rename, rm } from "node:fs/promises"
import { dirname, extname, join } from "node:path"
import { HttpError } from "../../middleware/httpError.js"
import type { OperationLogRepository } from "../logs/types.js"
import { excerptHtml } from "./excerpt.js"
import { sanitizePostBody } from "./sanitize.js"
import type {
  Attachment,
  Comment,
  CreatePostInput,
  Post,
  PostRepository,
  PostSummary,
  UpdatePostInput,
} from "./types.js"

const EXCERPT_LENGTH = 150

function generatePermalinkSlug(): string {
  return randomBytes(8).toString("hex")
}

export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly operationLog: OperationLogRepository,
    private readonly storageDir: string,
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
      publishStartAt: row.publishStartAt,
      publishEndAt: row.publishEndAt,
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
    const paths = await this.repository.delete(postId)
    await Promise.all(paths.map((path) => rm(path, { force: true })))
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

  async listAttachments(postId: number): Promise<Attachment[]> {
    return this.repository.listAttachments(postId)
  }

  async getAttachment(attachmentId: number): Promise<Attachment | undefined> {
    return this.repository.findAttachmentById(attachmentId)
  }

  async addAttachment(
    postId: number,
    originalName: string,
    tempPath: string,
    actorId: number,
  ): Promise<Attachment> {
    const post = await this.repository.findById(postId)
    if (!post) {
      throw new HttpError(404, "投稿が見つかりません")
    }

    const storedName = `${randomUUID()}${extname(originalName)}`
    const destPath = join(this.storageDir, storedName)
    await mkdir(dirname(destPath), { recursive: true })
    await rename(tempPath, destPath)

    const attachment = await this.repository.addAttachment(postId, originalName, destPath)
    await this.operationLog.record({
      actorId,
      targetType: "post",
      targetId: String(postId),
      action: "attach",
    })
    return attachment
  }

  async deleteAttachment(attachmentId: number, actorId: number): Promise<void> {
    const attachment = await this.repository.findAttachmentById(attachmentId)
    if (!attachment) {
      throw new HttpError(404, "添付ファイルが見つかりません")
    }
    await this.repository.deleteAttachment(attachmentId)
    await rm(attachment.filePath, { force: true })
    await this.operationLog.record({
      actorId,
      targetType: "post",
      targetId: String(attachment.postId),
      action: "detach",
    })
  }

  /** 一括削除の実行前プレビュー(要件3-6章: 対象件数を確認してから実行する) */
  async previewBulkDelete(from: string, to: string): Promise<{ count: number }> {
    const ids = await this.repository.listIdsByUpdatedAtRange(from, to)
    return { count: ids.length }
  }

  async executeBulkDelete(from: string, to: string, actorId: number): Promise<{ count: number }> {
    const ids = await this.repository.listIdsByUpdatedAtRange(from, to)
    for (const postId of ids) {
      const paths = await this.repository.delete(postId)
      await Promise.all(paths.map((path) => rm(path, { force: true })))
    }
    await this.operationLog.record({
      actorId,
      targetType: "post",
      targetId: `bulk:${from}~${to}`,
      action: "bulk_delete",
    })
    return { count: ids.length }
  }
}
