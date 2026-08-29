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

export interface CreatePostInput {
  authorId: number
  title: string
  bodyHtml: string
  visibilityScope: PostVisibilityScope
  groupId: number | null
}

export interface UpdatePostInput {
  title?: string
  bodyHtml?: string
  visibilityScope?: PostVisibilityScope
  groupId?: number | null
}

export interface PostRepository {
  list(viewerId: number): Promise<PostListRow[]>
  findById(postId: number): Promise<Post | undefined>
  findBySlug(slug: string): Promise<Post | undefined>
  create(input: CreatePostInput & { permalinkSlug: string }): Promise<Post>
  update(postId: number, input: UpdatePostInput): Promise<Post>
  delete(postId: number): Promise<void>
  listComments(postId: number): Promise<Comment[]>
  addComment(postId: number, authorId: number, body: string): Promise<Comment>
  markRead(postId: number, userId: number): Promise<void>
  isRead(postId: number, userId: number): Promise<boolean>
  /** 最終更新日でFrom-To指定した対象の投稿IDを返す(一括削除のプレビュー・実行で共用) */
  listIdsByUpdatedAtRange(from: string, to: string): Promise<number[]>
}
