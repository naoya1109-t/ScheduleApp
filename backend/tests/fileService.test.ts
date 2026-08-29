import { existsSync } from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { HttpError } from "../src/middleware/httpError.js"
import { FileService } from "../src/modules/files/fileService.js"
import { FakeFileRepository } from "./fakeFileRepository.js"
import { FakeFolderRepository } from "./fakeFolderRepository.js"
import { FakeOperationLogRepository } from "./fakeOperationLogRepository.js"

let workDir: string
let storageDir: string

async function createTempUpload(content: string): Promise<string> {
  const path = join(workDir, `upload-${Math.random().toString(16).slice(2)}.tmp`)
  await writeFile(path, content)
  return path
}

function setup() {
  const fileRepository = new FakeFileRepository()
  const folderRepository = new FakeFolderRepository()
  const operationLog = new FakeOperationLogRepository()
  const service = new FileService(fileRepository, folderRepository, operationLog, storageDir)
  return { fileRepository, folderRepository, operationLog, service }
}

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "casemax-upload-"))
  storageDir = await mkdtemp(join(tmpdir(), "casemax-storage-"))
})

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true })
  await rm(storageDir, { recursive: true, force: true })
})

describe("FileService", () => {
  it("新規アップロードでファイルがストレージへ移動され、DBに登録される", async () => {
    const { folderRepository, service, operationLog } = setup()
    const folder = await folderRepository.create("資料", null)
    const tempPath = await createTempUpload("hello")

    const created = await service.uploadNewFile(folder.folderId, "資料.txt", tempPath, 1)

    expect(existsSync(created.currentPath)).toBe(true)
    expect(existsSync(tempPath)).toBe(false)
    expect(created.fileName).toBe("資料.txt")
    expect(operationLog.records[0].action).toBe("create")
  })

  it("存在しないフォルダへのアップロードは失敗する", async () => {
    const { service } = setup()
    const tempPath = await createTempUpload("hello")

    await expect(service.uploadNewFile(999, "資料.txt", tempPath, 1)).rejects.toThrow(HttpError)
  })

  it("再アップロードは新しいバージョンとして追加され、旧バージョンも保持される", async () => {
    const { folderRepository, fileRepository, service } = setup()
    const folder = await folderRepository.create("資料", null)
    const firstUpload = await createTempUpload("v1")
    const created = await service.uploadNewFile(folder.folderId, "資料.txt", firstUpload, 1)

    const secondUpload = await createTempUpload("v2")
    const updated = await service.uploadNewVersion(created.fileId, secondUpload, "資料.txt", 2)

    const versions = await fileRepository.listVersions(created.fileId)
    expect(versions).toHaveLength(2)
    expect(updated.updatedBy).toBe(2)
    expect(existsSync(versions[0].filePath)).toBe(true) // 最新版
    expect(existsSync(versions[1].filePath)).toBe(true) // 旧版も残る
  })

  it("削除するとDB上のレコードと全バージョンの実体ファイルが両方消える", async () => {
    const { folderRepository, fileRepository, service, operationLog } = setup()
    const folder = await folderRepository.create("資料", null)
    const tempPath = await createTempUpload("v1")
    const created = await service.uploadNewFile(folder.folderId, "資料.txt", tempPath, 1)
    const versionsBeforeDelete = await fileRepository.listVersions(created.fileId)

    await service.deleteFile(created.fileId, 1)

    expect(await fileRepository.findById(created.fileId)).toBeUndefined()
    expect(existsSync(versionsBeforeDelete[0].filePath)).toBe(false)
    expect(operationLog.records.map((r) => r.action)).toEqual(["create", "delete"])
  })

  it("ゴミ箱機能を持たないため、削除は取り消せない(即時に実体・レコードとも消える)", async () => {
    const { folderRepository, fileRepository, service } = setup()
    const folder = await folderRepository.create("資料", null)
    const tempPath = await createTempUpload("v1")
    const created = await service.uploadNewFile(folder.folderId, "資料.txt", tempPath, 1)

    await service.deleteFile(created.fileId, 1)

    expect(await fileRepository.findById(created.fileId)).toBeUndefined()
  })
})
