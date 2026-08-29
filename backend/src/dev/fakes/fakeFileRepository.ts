import type { CreateFileInput, FileItem, FileRepository, FileVersion } from "../../modules/files/types.js"

export class FakeFileRepository implements FileRepository {
  files: FileItem[] = []
  versions: FileVersion[] = []
  updaterNames = new Map<number, string>()
  private nextFileId = 1
  private nextVersionId = 1

  setUpdaterName(userId: number, name: string): void {
    this.updaterNames.set(userId, name)
  }

  async listByFolder(folderId: number): Promise<FileItem[]> {
    return this.files.filter((file) => file.folderId === folderId)
  }

  async listRecent(limit: number): Promise<FileItem[]> {
    return [...this.files].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit)
  }

  async findById(fileId: number): Promise<FileItem | undefined> {
    return this.files.find((file) => file.fileId === fileId)
  }

  async findBySlug(slug: string): Promise<FileItem | undefined> {
    return this.files.find((file) => file.permalinkSlug === slug)
  }

  async createFile(input: CreateFileInput): Promise<FileItem> {
    const file: FileItem = {
      fileId: this.nextFileId++,
      folderId: input.folderId,
      fileName: input.fileName,
      currentPath: input.currentPath,
      updatedBy: input.updatedBy,
      updatedByName: this.updaterNames.get(input.updatedBy) ?? "unknown",
      updatedAt: new Date().toISOString(),
      permalinkSlug: input.permalinkSlug,
    }
    this.files.push(file)
    this.versions.push({
      versionId: this.nextVersionId++,
      fileId: file.fileId,
      versionNo: 1,
      filePath: input.currentPath,
      createdAt: file.updatedAt,
    })
    return file
  }

  async addVersion(fileId: number, filePath: string, updatedBy: number): Promise<FileItem> {
    const file = this.files.find((candidate) => candidate.fileId === fileId)
    if (!file) {
      throw new Error("ファイルが見つかりません")
    }
    const existingVersions = this.versions.filter((version) => version.fileId === fileId)
    const nextVersionNo = Math.max(0, ...existingVersions.map((version) => version.versionNo)) + 1
    this.versions.push({
      versionId: this.nextVersionId++,
      fileId,
      versionNo: nextVersionNo,
      filePath,
      createdAt: new Date().toISOString(),
    })
    file.currentPath = filePath
    file.updatedBy = updatedBy
    file.updatedByName = this.updaterNames.get(updatedBy) ?? "unknown"
    file.updatedAt = new Date().toISOString()
    return file
  }

  async listVersions(fileId: number): Promise<FileVersion[]> {
    return this.versions.filter((version) => version.fileId === fileId).sort((a, b) => b.versionNo - a.versionNo)
  }

  async delete(fileId: number): Promise<string[]> {
    const paths = this.versions.filter((version) => version.fileId === fileId).map((version) => version.filePath)
    this.versions = this.versions.filter((version) => version.fileId !== fileId)
    this.files = this.files.filter((file) => file.fileId !== fileId)
    return paths
  }
}
