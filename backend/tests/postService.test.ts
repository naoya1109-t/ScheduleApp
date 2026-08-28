import { describe, expect, it } from "vitest"
import { PostService } from "../src/modules/board/postService.js"
import { FakeOperationLogRepository } from "./fakeOperationLogRepository.js"
import { FakePostRepository } from "./fakePostRepository.js"

function setup() {
  const repository = new FakePostRepository()
  const log = new FakeOperationLogRepository()
  const service = new PostService(repository, log)
  repository.setAuthorName(1, "山田太郎")
  return { repository, log, service }
}

describe("PostService", () => {
  it("投稿本文はサニタイズしてから保存する(XSS対策)", async () => {
    const { repository, service } = setup()
    await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: '<p>本文</p><script>alert(1)</script>',
      visibilityScope: "company",
      groupId: null,
    })
    expect(repository.posts[0].bodyHtml).not.toContain("<script>")
  })

  it("投稿作成・更新・削除はすべて操作ログに記録される", async () => {
    const { service, log } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    await service.updatePost(created.postId, 1, { title: "更新後タイトル" })
    await service.deletePost(created.postId, 1)

    expect(log.records.map((r) => r.action)).toEqual(["create", "update", "delete"])
    expect(log.records.every((r) => r.targetType === "post")).toBe(true)
  })

  it("全社向け投稿は誰でも一覧に表示される", async () => {
    const { repository, service } = setup()
    await service.createPost({
      authorId: 1,
      title: "全社お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    repository.setUserGroups(2, [])

    const posts = await service.listPosts(2)
    expect(posts).toHaveLength(1)
  })

  it("部署別投稿は所属していない利用者には表示されない", async () => {
    const { repository, service } = setup()
    await service.createPost({
      authorId: 1,
      title: "総務部お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "group",
      groupId: 10,
    })
    repository.setUserGroups(2, [99])
    repository.setUserGroups(3, [10])

    const postsForOutsider = await service.listPosts(2)
    const postsForMember = await service.listPosts(3)

    expect(postsForOutsider).toHaveLength(0)
    expect(postsForMember).toHaveLength(1)
  })

  it("一覧では本文が抜粋表示になる", async () => {
    const { service } = setup()
    const longText = "あ".repeat(300)
    await service.createPost({
      authorId: 1,
      title: "長文お知らせ",
      bodyHtml: `<p>${longText}</p>`,
      visibilityScope: "company",
      groupId: null,
    })

    const posts = await service.listPosts(1)
    expect(posts[0].excerptHtml.length).toBeLessThan(longText.length)
    expect(posts[0].excerptHtml).toContain("…")
  })

  it("既読にした投稿は一覧でisRead=trueになる", async () => {
    const { service } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })

    await service.markRead(created.postId, 1)
    const posts = await service.listPosts(1)
    expect(posts[0].isRead).toBe(true)
  })

  it("コメントを追加できる", async () => {
    const { repository, service } = setup()
    repository.setAuthorName(2, "鈴木花子")
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })

    const comment = await service.addComment(created.postId, 2, "了解しました")
    const comments = await service.listComments(created.postId)

    expect(comment.authorName).toBe("鈴木花子")
    expect(comments).toHaveLength(1)
  })
})
