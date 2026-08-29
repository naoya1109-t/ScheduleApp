export interface Folder {
  folderId: number
  parentFolderId: number | null
  name: string
}

export interface FileItem {
  fileId: number
  folderId: number
  fileName: string
  currentPath: string
  updatedBy: number
  updatedByName: string
  updatedAt: string
  permalinkSlug: string
}

export interface FileVersion {
  versionId: number
  fileId: number
  versionNo: number
  filePath: string
  createdAt: string
}

export interface FolderRepository {
  listChildren(parentFolderId: number | null): Promise<Folder[]>
  findById(folderId: number): Promise<Folder | undefined>
  create(name: string, parentFolderId: number | null): Promise<Folder>
}

export interface CreateFileInput {
  folderId: number
  fileName: string
  currentPath: string
  updatedBy: number
  permalinkSlug: string
}

export interface FileRepository {
  listByFolder(folderId: number): Promise<FileItem[]>
  listRecent(limit: number): Promise<FileItem[]>
  findById(fileId: number): Promise<FileItem | undefined>
  findBySlug(slug: string): Promise<FileItem | undefined>
  createFile(input: CreateFileInput): Promise<FileItem>
  addVersion(fileId: number, filePath: string, updatedBy: number): Promise<FileItem>
  listVersions(fileId: number): Promise<FileVersion[]>
  /** 削除対象ファイルの全バージョンの物理パスを返す(ディスク削除用) */
  delete(fileId: number): Promise<string[]>
}
