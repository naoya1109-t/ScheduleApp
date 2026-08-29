import type { ConnectionPool } from "mssql"
import type { CreateFileInput, FileItem, FileRepository, FileVersion } from "./types.js"

interface FileRow {
  file_id: number
  folder_id: number
  file_name: string
  current_path: string
  updated_by: number
  updated_by_name: string
  updated_at: string
  permalink_slug: string
}

function toFile(row: FileRow): FileItem {
  return {
    fileId: row.file_id,
    folderId: row.folder_id,
    fileName: row.file_name,
    currentPath: row.current_path,
    updatedBy: row.updated_by,
    updatedByName: row.updated_by_name,
    updatedAt: row.updated_at,
    permalinkSlug: row.permalink_slug,
  }
}

const FILE_SELECT = `
  SELECT f.file_id, f.folder_id, f.file_name, f.current_path, f.updated_by,
         u.name AS updated_by_name, f.updated_at, f.permalink_slug
  FROM file_item f
  JOIN app_user u ON u.user_id = f.updated_by
`

export class MssqlFileRepository implements FileRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listByFolder(folderId: number): Promise<FileItem[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("folderId", folderId)
      .query<FileRow>(`${FILE_SELECT} WHERE f.folder_id = @folderId ORDER BY f.file_name`)
    return result.recordset.map(toFile)
  }

  async listRecent(limit: number): Promise<FileItem[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("limit", limit)
      .query<FileRow>(`SELECT TOP (@limit) * FROM (${FILE_SELECT}) AS x ORDER BY updated_at DESC`)
    return result.recordset.map(toFile)
  }

  async findById(fileId: number): Promise<FileItem | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("fileId", fileId)
      .query<FileRow>(`${FILE_SELECT} WHERE f.file_id = @fileId`)
    const row = result.recordset[0]
    return row ? toFile(row) : undefined
  }

  async findBySlug(slug: string): Promise<FileItem | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("slug", slug)
      .query<FileRow>(`${FILE_SELECT} WHERE f.permalink_slug = @slug`)
    const row = result.recordset[0]
    return row ? toFile(row) : undefined
  }

  async createFile(input: CreateFileInput): Promise<FileItem> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      const insertResult = await transaction
        .request()
        .input("folderId", input.folderId)
        .input("fileName", input.fileName)
        .input("currentPath", input.currentPath)
        .input("updatedBy", input.updatedBy)
        .input("permalinkSlug", input.permalinkSlug).query<{ file_id: number }>(`
          INSERT INTO file_item (folder_id, file_name, current_path, updated_by, permalink_slug)
          OUTPUT inserted.file_id
          VALUES (@folderId, @fileName, @currentPath, @updatedBy, @permalinkSlug)
        `)
      const fileId = insertResult.recordset[0].file_id
      await transaction
        .request()
        .input("fileId", fileId)
        .input("versionNo", 1)
        .input("filePath", input.currentPath)
        .query(
          "INSERT INTO file_version (file_id, version_no, file_path) VALUES (@fileId, @versionNo, @filePath)",
        )
      await transaction.commit()
      const created = await this.findById(fileId)
      if (!created) {
        throw new Error("ファイルの作成に失敗しました")
      }
      return created
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async addVersion(fileId: number, filePath: string, updatedBy: number): Promise<FileItem> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      const maxVersionResult = await transaction
        .request()
        .input("fileId", fileId)
        .query<{ max_version: number }>(
          "SELECT ISNULL(MAX(version_no), 0) AS max_version FROM file_version WHERE file_id = @fileId",
        )
      const nextVersionNo = maxVersionResult.recordset[0].max_version + 1

      await transaction
        .request()
        .input("fileId", fileId)
        .input("versionNo", nextVersionNo)
        .input("filePath", filePath)
        .query(
          "INSERT INTO file_version (file_id, version_no, file_path) VALUES (@fileId, @versionNo, @filePath)",
        )
      await transaction
        .request()
        .input("fileId", fileId)
        .input("currentPath", filePath)
        .input("updatedBy", updatedBy)
        .query(
          "UPDATE file_item SET current_path = @currentPath, updated_by = @updatedBy, updated_at = SYSUTCDATETIME() WHERE file_id = @fileId",
        )
      await transaction.commit()
      const updated = await this.findById(fileId)
      if (!updated) {
        throw new Error("ファイルの更新に失敗しました")
      }
      return updated
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async listVersions(fileId: number): Promise<FileVersion[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("fileId", fileId)
      .query<{ version_id: number; file_id: number; version_no: number; file_path: string; created_at: string }>(
        "SELECT * FROM file_version WHERE file_id = @fileId ORDER BY version_no DESC",
      )
    return result.recordset.map((row) => ({
      versionId: row.version_id,
      fileId: row.file_id,
      versionNo: row.version_no,
      filePath: row.file_path,
      createdAt: row.created_at,
    }))
  }

  async delete(fileId: number): Promise<string[]> {
    const pool = await this.getPool()
    const versionsResult = await pool
      .request()
      .input("fileId", fileId)
      .query<{ file_path: string }>("SELECT file_path FROM file_version WHERE file_id = @fileId")
    const paths = versionsResult.recordset.map((row) => row.file_path)

    const transaction = pool.transaction()
    await transaction.begin()
    try {
      await transaction.request().input("fileId", fileId).query("DELETE FROM file_version WHERE file_id = @fileId")
      await transaction.request().input("fileId", fileId).query("DELETE FROM file_item WHERE file_id = @fileId")
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    return paths
  }
}
