import { existsSync } from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { HttpError } from "../src/middleware/httpError.js"
import { PostService } from "../src/modules/board/postService.js"
import { FakeOperationLogRepository } from "./fakeOperationLogRepository.js"
import { FakePostRepository } from "./fakePostRepository.js"

let workDir: string
let storageDir: string

async function createTempUpload(content: string): Promise<string> {
  const path = join(workDir, `upload-${Math.random().toString(16).slice(2)}.tmp`)
  await writeFile(path, content)
  return path
}

function setup() {
  const repository = new FakePostRepository()
  const operationLog = new FakeOperationLogRepository()
  const service = new PostService(repository, operationLog, storageDir)
  repository.setAuthorName(1, "山田太郎")
  return { repository, operationLog, service }
}

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "casemax-attach-upload-"))
  storageDir = await mkdtemp(join(tmpdir(), "casemax-attach-storage-"))
})

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true })
  await rm(storageDir, { recursive: true, force: true })
})

describe("お知らせ・掲示板の添付ファイル", () => {
  it("投稿に添付ファイルを追加すると、実体がstorageへ移動されDBに登録される", async () => {
    const { service } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    const tempPath = await createTempUpload("dummy content")

    const attachment = await service.addAttachment(created.postId, "資料.pdf", tempPath, 1)

    expect(attachment.fileName).toBe("資料.pdf")
    expect(existsSync(attachment.filePath)).toBe(true)
    expect(existsSync(tempPath)).toBe(false)

    const attachments = await service.listAttachments(created.postId)
    expect(attachments).toHaveLength(1)
  })

  it("存在しない投稿への添付はエラーになる", async () => {
    const { service } = setup()
    const tempPath = await createTempUpload("dummy content")

    await expect(service.addAttachment(999, "資料.pdf", tempPath, 1)).rejects.toThrow(HttpError)
  })

  it("添付ファイルを削除すると、DBレコードと実体ファイルの両方が消える", async () => {
    const { service } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    const tempPath = await createTempUpload("dummy content")
    const attachment = await service.addAttachment(created.postId, "資料.pdf", tempPath, 1)

    await service.deleteAttachment(attachment.attachmentId, 1)

    expect(await service.getAttachment(attachment.attachmentId)).toBeUndefined()
    expect(existsSync(attachment.filePath)).toBe(false)
  })

  it("投稿を削除すると、添付ファイルの実体もあわせて削除される", async () => {
    const { service } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    const tempPath = await createTempUpload("dummy content")
    const attachment = await service.addAttachment(created.postId, "資料.pdf", tempPath, 1)

    await service.deletePost(created.postId, 1)

    expect(existsSync(attachment.filePath)).toBe(false)
  })

  it("添付・削除は操作ログに記録される", async () => {
    const { service, operationLog } = setup()
    const created = await service.createPost({
      authorId: 1,
      title: "お知らせ",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    const tempPath = await createTempUpload("dummy content")
    const attachment = await service.addAttachment(created.postId, "資料.pdf", tempPath, 1)
    await service.deleteAttachment(attachment.attachmentId, 1)

    expect(operationLog.records.map((r) => r.action)).toEqual(["create", "attach", "detach"])
  })
})
