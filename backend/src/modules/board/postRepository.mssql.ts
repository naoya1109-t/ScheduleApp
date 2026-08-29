import type { ConnectionPool } from "mssql"
import type {
  Attachment,
  Comment,
  CreatePostInput,
  Post,
  PostListRow,
  PostRepository,
  PostVisibilityScope,
  UpdatePostInput,
} from "./types.js"

interface PostRow {
  post_id: number
  author_id: number
  author_name: string
  title: string
  body_html: string
  visibility_scope: PostVisibilityScope
  group_id: number | null
  updated_at: string
  permalink_slug: string
  publish_start_at: string | null
  publish_end_at: string | null
}

function toPost(row: PostRow): Post {
  return {
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    bodyHtml: row.body_html,
    visibilityScope: row.visibility_scope,
    groupId: row.group_id,
    updatedAt: row.updated_at,
    permalinkSlug: row.permalink_slug,
    publishStartAt: row.publish_start_at,
    publishEndAt: row.publish_end_at,
  }
}

const POST_SELECT = `
  SELECT p.post_id, p.author_id, u.name AS author_name, p.title, p.body_html,
         p.visibility_scope, p.group_id, p.updated_at, p.permalink_slug,
         p.publish_start_at, p.publish_end_at
  FROM post p
  JOIN app_user u ON u.user_id = p.author_id
`

export class MssqlPostRepository implements PostRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async list(viewerId: number): Promise<PostListRow[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("viewerId", viewerId).query<PostRow & { is_read: number }>(`
        SELECT p.post_id, p.author_id, u.name AS author_name, p.title, p.body_html,
               p.visibility_scope, p.group_id, p.updated_at, p.permalink_slug,
               p.publish_start_at, p.publish_end_at,
               CASE WHEN pr.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_read
        FROM post p
        JOIN app_user u ON u.user_id = p.author_id
        LEFT JOIN post_read pr ON pr.post_id = p.post_id AND pr.user_id = @viewerId
        WHERE (
          p.visibility_scope = 'company'
          OR (p.visibility_scope = 'group' AND p.group_id IN (
                SELECT group_id FROM user_group WHERE user_id = @viewerId
              ))
        )
        AND (
          p.author_id = @viewerId
          OR (
            (p.publish_start_at IS NULL OR p.publish_start_at <= SYSUTCDATETIME())
            AND (p.publish_end_at IS NULL OR p.publish_end_at >= SYSUTCDATETIME())
          )
        )
        ORDER BY p.updated_at DESC
      `)
    return result.recordset.map((row) => ({ ...toPost(row), isRead: row.is_read === 1 }))
  }

  async findById(postId: number): Promise<Post | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("postId", postId)
      .query<PostRow>(`${POST_SELECT} WHERE p.post_id = @postId`)
    const row = result.recordset[0]
    return row ? toPost(row) : undefined
  }

  async findBySlug(slug: string): Promise<Post | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("slug", slug)
      .query<PostRow>(`${POST_SELECT} WHERE p.permalink_slug = @slug`)
    const row = result.recordset[0]
    return row ? toPost(row) : undefined
  }

  async create(input: CreatePostInput & { permalinkSlug: string }): Promise<Post> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("authorId", input.authorId)
      .input("title", input.title)
      .input("bodyHtml", input.bodyHtml)
      .input("visibilityScope", input.visibilityScope)
      .input("groupId", input.groupId)
      .input("permalinkSlug", input.permalinkSlug)
      .input("publishStartAt", input.publishStartAt ?? null)
      .input("publishEndAt", input.publishEndAt ?? null).query<{ post_id: number }>(`
        INSERT INTO post (author_id, title, body_html, visibility_scope, group_id, permalink_slug, publish_start_at, publish_end_at)
        OUTPUT inserted.post_id
        VALUES (@authorId, @title, @bodyHtml, @visibilityScope, @groupId, @permalinkSlug, @publishStartAt, @publishEndAt)
      `)
    const created = await this.findById(result.recordset[0].post_id)
    if (!created) {
      throw new Error("投稿の作成に失敗しました")
    }
    return created
  }

  async update(postId: number, input: UpdatePostInput): Promise<Post> {
    const pool = await this.getPool()
    const request = pool.request().input("postId", postId)
    const assignments: string[] = ["updated_at = SYSUTCDATETIME()"]
    if (input.title !== undefined) {
      request.input("title", input.title)
      assignments.push("title = @title")
    }
    if (input.bodyHtml !== undefined) {
      request.input("bodyHtml", input.bodyHtml)
      assignments.push("body_html = @bodyHtml")
    }
    if (input.visibilityScope !== undefined) {
      request.input("visibilityScope", input.visibilityScope)
      assignments.push("visibility_scope = @visibilityScope")
    }
    if (input.groupId !== undefined) {
      request.input("groupId", input.groupId)
      assignments.push("group_id = @groupId")
    }
    if (input.publishStartAt !== undefined) {
      request.input("publishStartAt", input.publishStartAt)
      assignments.push("publish_start_at = @publishStartAt")
    }
    if (input.publishEndAt !== undefined) {
      request.input("publishEndAt", input.publishEndAt)
      assignments.push("publish_end_at = @publishEndAt")
    }
    await request.query(`UPDATE post SET ${assignments.join(", ")} WHERE post_id = @postId`)
    const updated = await this.findById(postId)
    if (!updated) {
      throw new Error("投稿が見つかりません")
    }
    return updated
  }

  async delete(postId: number): Promise<string[]> {
    const pool = await this.getPool()
    const attachmentsResult = await pool
      .request()
      .input("postId", postId)
      .query<{ file_path: string }>("SELECT file_path FROM post_attachment WHERE post_id = @postId")
    const paths = attachmentsResult.recordset.map((row) => row.file_path)

    const transaction = pool.transaction()
    await transaction.begin()
    try {
      await transaction.request().input("postId", postId).query("DELETE FROM post_read WHERE post_id = @postId")
      await transaction
        .request()
        .input("postId", postId)
        .query("DELETE FROM post_comment WHERE post_id = @postId")
      await transaction
        .request()
        .input("postId", postId)
        .query("DELETE FROM post_attachment WHERE post_id = @postId")
      await transaction.request().input("postId", postId).query("DELETE FROM post WHERE post_id = @postId")
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    return paths
  }

  async listAttachments(postId: number): Promise<Attachment[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("postId", postId)
      .query<{ attachment_id: number; post_id: number; file_name: string; file_path: string }>(
        "SELECT attachment_id, post_id, file_name, file_path FROM post_attachment WHERE post_id = @postId",
      )
    return result.recordset.map((row) => ({
      attachmentId: row.attachment_id,
      postId: row.post_id,
      fileName: row.file_name,
      filePath: row.file_path,
    }))
  }

  async addAttachment(postId: number, fileName: string, filePath: string): Promise<Attachment> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("postId", postId)
      .input("fileName", fileName)
      .input("filePath", filePath).query<{ attachment_id: number }>(`
        INSERT INTO post_attachment (post_id, file_name, file_path)
        OUTPUT inserted.attachment_id
        VALUES (@postId, @fileName, @filePath)
      `)
    return { attachmentId: result.recordset[0].attachment_id, postId, fileName, filePath }
  }

  async findAttachmentById(attachmentId: number): Promise<Attachment | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("attachmentId", attachmentId)
      .query<{ attachment_id: number; post_id: number; file_name: string; file_path: string }>(
        "SELECT attachment_id, post_id, file_name, file_path FROM post_attachment WHERE attachment_id = @attachmentId",
      )
    const row = result.recordset[0]
    return row
      ? { attachmentId: row.attachment_id, postId: row.post_id, fileName: row.file_name, filePath: row.file_path }
      : undefined
  }

  async deleteAttachment(attachmentId: number): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("attachmentId", attachmentId)
      .query("DELETE FROM post_attachment WHERE attachment_id = @attachmentId")
  }

  async listIdsByUpdatedAtRange(from: string, to: string): Promise<number[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("from", from)
      .input("to", to)
      .query<{ post_id: number }>("SELECT post_id FROM post WHERE updated_at >= @from AND updated_at <= @to")
    return result.recordset.map((row) => row.post_id)
  }

  async listComments(postId: number): Promise<Comment[]> {
    const pool = await this.getPool()
    const result = await pool.request().input("postId", postId).query<{
      comment_id: number
      post_id: number
      author_id: number
      author_name: string
      body: string
      created_at: string
    }>(`
      SELECT c.comment_id, c.post_id, c.author_id, u.name AS author_name, c.body, c.created_at
      FROM post_comment c
      JOIN app_user u ON u.user_id = c.author_id
      WHERE c.post_id = @postId
      ORDER BY c.created_at ASC
    `)
    return result.recordset.map((row) => ({
      commentId: row.comment_id,
      postId: row.post_id,
      authorId: row.author_id,
      authorName: row.author_name,
      body: row.body,
      createdAt: row.created_at,
    }))
  }

  async addComment(postId: number, authorId: number, body: string): Promise<Comment> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("postId", postId)
      .input("authorId", authorId)
      .input("body", body).query<{ comment_id: number }>(`
        INSERT INTO post_comment (post_id, author_id, body)
        OUTPUT inserted.comment_id
        VALUES (@postId, @authorId, @body)
      `)
    const comments = await this.listComments(postId)
    const created = comments.find((comment) => comment.commentId === result.recordset[0].comment_id)
    if (!created) {
      throw new Error("コメントの作成に失敗しました")
    }
    return created
  }

  async markRead(postId: number, userId: number): Promise<void> {
    const pool = await this.getPool()
    await pool.request().input("postId", postId).input("userId", userId).query(`
      IF NOT EXISTS (SELECT 1 FROM post_read WHERE post_id = @postId AND user_id = @userId)
      INSERT INTO post_read (post_id, user_id) VALUES (@postId, @userId)
    `)
  }

  async isRead(postId: number, userId: number): Promise<boolean> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("postId", postId)
      .input("userId", userId)
      .query("SELECT 1 AS found FROM post_read WHERE post_id = @postId AND user_id = @userId")
    return result.recordset.length > 0
  }
}
