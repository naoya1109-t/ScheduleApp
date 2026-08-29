export type PostVisibilityScope = "company" | "group"

export interface Post {
  postId: number
  authorId: number
  authorName: string
  title: string
  bodyHtml: string
  visibilityScope: PostVisibilityScope
  groupId: number | null
  updatedAt: string
  permalinkSlug: string
  /** 未指定(null)の場合は即時公開 */
  publishStartAt: string | null
  /** 未指定(null)の場合は無期限に掲載 */
  publishEndAt: string | null
}

export interface PostSummary {
  postId: number
  authorName: string
  title: string
  excerptHtml: string
  visibilityScope: PostVisibilityScope
  groupId: number | null
  updatedAt: string
  permalinkSlug: string
  isRead: boolean
  publishStartAt: string | null
  publishEndAt: string | null
}

export type PostListRow = Post & { isRead: boolean }

export interface Comment {
  commentId: number
  postId: number
  authorId: number
  authorName: string
  body: string
  createdAt: string
}

export interface Attachment {
  attachmentId: number
  postId: number
  fileName: string
  filePath: string
}

export interface CreatePostInput {
  authorId: number
  title: string
  bodyHtml: string
  visibilityScope: PostVisibilityScope
  groupId: number | null
  publishStartAt?: string | null
  publishEndAt?: string | null
}

export interface UpdatePostInput {
  title?: string
  bodyHtml?: string
  visibilityScope?: PostVisibilityScope
  groupId?: number | null
  publishStartAt?: string | null
  publishEndAt?: string | null
}

export interface PostRepository {
  /** viewerId本人が著者の投稿は公開期間外でも表示する(登録できているかの確認用) */
  list(viewerId: number): Promise<PostListRow[]>
  findById(postId: number): Promise<Post | undefined>
  findBySlug(slug: string): Promise<Post | undefined>
  create(input: CreatePostInput & { permalinkSlug: string }): Promise<Post>
  update(postId: number, input: UpdatePostInput): Promise<Post>
  /** 削除対象投稿の全添付ファイルの物理パスを返す(ディスク削除用) */
  delete(postId: number): Promise<string[]>
  listComments(postId: number): Promise<Comment[]>
  addComment(postId: number, authorId: number, body: string): Promise<Comment>
  markRead(postId: number, userId: number): Promise<void>
  isRead(postId: number, userId: number): Promise<boolean>
  /** 最終更新日でFrom-To指定した対象の投稿IDを返す(一括削除のプレビュー・実行で共用) */
  listIdsByUpdatedAtRange(from: string, to: string): Promise<number[]>
  listAttachments(postId: number): Promise<Attachment[]>
  addAttachment(postId: number, fileName: string, filePath: string): Promise<Attachment>
  findAttachmentById(attachmentId: number): Promise<Attachment | undefined>
  deleteAttachment(attachmentId: number): Promise<void>
}
