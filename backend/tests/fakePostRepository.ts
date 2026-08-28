import type {
  Comment,
  CreatePostInput,
  Post,
  PostListRow,
  PostRepository,
  UpdatePostInput,
} from "../src/modules/board/types.js"

export class FakePostRepository implements PostRepository {
  posts: Post[] = []
  comments: Comment[] = []
  reads = new Set<string>()
  authorNames = new Map<number, string>()
  userGroups = new Map<number, number[]>()
  private nextPostId = 1
  private nextCommentId = 1

  setAuthorName(userId: number, name: string): void {
    this.authorNames.set(userId, name)
  }

  setUserGroups(userId: number, groupIds: number[]): void {
    this.userGroups.set(userId, groupIds)
  }

  async list(viewerId: number): Promise<PostListRow[]> {
    const viewerGroups = this.userGroups.get(viewerId) ?? []
    return this.posts
      .filter(
        (post) =>
          post.visibilityScope === "company" ||
          (post.visibilityScope === "group" && post.groupId !== null && viewerGroups.includes(post.groupId)),
      )
      .map((post) => ({
        ...post,
        isRead: this.reads.has(`${post.postId}:${viewerId}`),
      }))
  }

  async findById(postId: number): Promise<Post | undefined> {
    return this.posts.find((post) => post.postId === postId)
  }

  async findBySlug(slug: string): Promise<Post | undefined> {
    return this.posts.find((post) => post.permalinkSlug === slug)
  }

  async create(input: CreatePostInput & { permalinkSlug: string }): Promise<Post> {
    const post: Post = {
      postId: this.nextPostId++,
      authorId: input.authorId,
      authorName: this.authorNames.get(input.authorId) ?? "unknown",
      title: input.title,
      bodyHtml: input.bodyHtml,
      visibilityScope: input.visibilityScope,
      groupId: input.groupId,
      updatedAt: new Date().toISOString(),
      permalinkSlug: input.permalinkSlug,
    }
    this.posts.push(post)
    return post
  }

  async update(postId: number, input: UpdatePostInput): Promise<Post> {
    const post = this.posts.find((candidate) => candidate.postId === postId)
    if (!post) {
      throw new Error("投稿が見つかりません")
    }
    if (input.title !== undefined) post.title = input.title
    if (input.bodyHtml !== undefined) post.bodyHtml = input.bodyHtml
    if (input.visibilityScope !== undefined) post.visibilityScope = input.visibilityScope
    if (input.groupId !== undefined) post.groupId = input.groupId
    post.updatedAt = new Date().toISOString()
    return post
  }

  async delete(postId: number): Promise<void> {
    this.posts = this.posts.filter((post) => post.postId !== postId)
    this.comments = this.comments.filter((comment) => comment.postId !== postId)
  }

  async listComments(postId: number): Promise<Comment[]> {
    return this.comments.filter((comment) => comment.postId === postId)
  }

  async addComment(postId: number, authorId: number, body: string): Promise<Comment> {
    const comment: Comment = {
      commentId: this.nextCommentId++,
      postId,
      authorId,
      authorName: this.authorNames.get(authorId) ?? "unknown",
      body,
      createdAt: new Date().toISOString(),
    }
    this.comments.push(comment)
    return comment
  }

  async markRead(postId: number, userId: number): Promise<void> {
    this.reads.add(`${postId}:${userId}`)
  }

  async isRead(postId: number, userId: number): Promise<boolean> {
    return this.reads.has(`${postId}:${userId}`)
  }
}
