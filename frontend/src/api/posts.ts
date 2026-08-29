import { apiFetch } from "./client"

export type PostVisibilityScope = "company" | "group"

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

export interface Comment {
  commentId: number
  postId: number
  authorId: number
  authorName: string
  body: string
  createdAt: string
}

export interface CreatePostInput {
  title: string
  bodyHtml: string
  visibilityScope: PostVisibilityScope
  groupId: number | null
}

export function listPosts(): Promise<PostSummary[]> {
  return apiFetch<PostSummary[]>("/api/posts")
}

export function getPost(postId: number): Promise<Post> {
  return apiFetch<Post>(`/api/posts/${postId}`)
}

export function getPostBySlug(slug: string): Promise<Post> {
  return apiFetch<Post>(`/api/posts/by-slug/${slug}`)
}

export function createPost(input: CreatePostInput): Promise<Post> {
  return apiFetch<Post>("/api/posts", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function listComments(postId: number): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/posts/${postId}/comments`)
}

export function addComment(postId: number, body: string): Promise<Comment> {
  return apiFetch<Comment>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export function markPostRead(postId: number): Promise<void> {
  return apiFetch<void>(`/api/posts/${postId}/read`, { method: "POST" })
}

export function previewBulkDeletePosts(from: string, to: string): Promise<{ count: number }> {
  const params = new URLSearchParams({ from, to })
  return apiFetch<{ count: number }>(`/api/posts/bulk-delete/preview?${params.toString()}`)
}

export function executeBulkDeletePosts(from: string, to: string): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/api/posts/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ from, to }),
  })
}
