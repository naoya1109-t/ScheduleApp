import { randomBytes, randomUUID } from "node:crypto"
import { mkdir, rename, rm } from "node:fs/promises"
import { dirname, extname, join } from "node:path"
import { HttpError } from "../../middleware/httpError.js"
import type { OperationLogRepository } from "../logs/types.js"
import type { FileItem, FileRepository, Folder, FolderRepository } from "./types.js"

function generatePermalinkSlug(): string {
  return randomBytes(8).toString("hex")
}

export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly folderRepository: FolderRepository,
    private readonly operationLog: OperationLogRepository,
    private readonly storageDir: string,
  ) {}

  async listFolders(parentFolderId: number | null): Promise<Folder[]> {
    return this.folderRepository.listChildren(parentFolderId)
  }

  async createFolder(name: string, parentFolderId: number | null): Promise<Folder> {
    return this.folderRepository.create(name, parentFolderId)
  }

  async listFiles(folderId: number): Promise<FileItem[]> {
    return this.fileRepository.listByFolder(folderId)
  }

  async listRecentFiles(limit: number): Promise<FileItem[]> {
    return this.fileRepository.listRecent(limit)
  }

  async getFile(fileId: number): Promise<FileItem | undefined> {
    return this.fileRepository.findById(fileId)
  }

  async getFileBySlug(slug: string): Promise<FileItem | undefined> {
    return this.fileRepository.findBySlug(slug)
  }

  /** multerが一時保存したファイルを、確定パスへ移動してからDBに登録する */
  async uploadNewFile(
    folderId: number,
    originalName: string,
    tempPath: string,
    uploaderId: number,
  ): Promise<FileItem> {
    const folder = await this.folderRepository.findById(folderId)
    if (!folder) {
      throw new HttpError(404, "フォルダが見つかりません")
    }

    const storedName = `${randomUUID()}${extname(originalName)}`
    const destPath = join(this.storageDir, storedName)
    await mkdir(dirname(destPath), { recursive: true })
    await rename(tempPath, destPath)

    const created = await this.fileRepository.createFile({
      folderId,
      fileName: originalName,
      currentPath: destPath,
      updatedBy: uploaderId,
      permalinkSlug: generatePermalinkSlug(),
    })

    await this.operationLog.record({
      actorId: uploaderId,
      targetType: "file",
      targetId: String(created.fileId),
      action: "create",
    })

    return created
  }

  /** 既存ファイルへの再アップロード(新しいバージョンとして追加) */
  async uploadNewVersion(
    fileId: number,
    tempPath: string,
    originalName: string,
    uploaderId: number,
  ): Promise<FileItem> {
    const existing = await this.fileRepository.findById(fileId)
    if (!existing) {
      throw new HttpError(404, "ファイルが見つかりません")
    }

    const storedName = `${randomUUID()}${extname(originalName)}`
    const destPath = join(this.storageDir, storedName)
    await mkdir(dirname(destPath), { recursive: true })
    await rename(tempPath, destPath)

    const updated = await this.fileRepository.addVersion(fileId, destPath, uploaderId)

    await this.operationLog.record({
      actorId: uploaderId,
      targetType: "file",
      targetId: String(fileId),
      action: "update",
    })

    return updated
  }

  async deleteFile(fileId: number, actorId: number): Promise<void> {
    const existing = await this.fileRepository.findById(fileId)
    if (!existing) {
      throw new HttpError(404, "ファイルが見つかりません")
    }
    const paths = await this.fileRepository.delete(fileId)
    await Promise.all(paths.map((path) => rm(path, { force: true })))

    await this.operationLog.record({
      actorId,
      targetType: "file",
      targetId: String(fileId),
      action: "delete",
    })
  }
}
