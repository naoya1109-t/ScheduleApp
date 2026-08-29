import type { ConnectionPool } from "mssql"
import type { Folder, FolderRepository } from "./types.js"

interface FolderRow {
  folder_id: number
  parent_folder_id: number | null
  name: string
}

function toFolder(row: FolderRow): Folder {
  return { folderId: row.folder_id, parentFolderId: row.parent_folder_id, name: row.name }
}

export class MssqlFolderRepository implements FolderRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listChildren(parentFolderId: number | null): Promise<Folder[]> {
    const pool = await this.getPool()
    const request = pool.request()
    const query =
      parentFolderId === null
        ? "SELECT * FROM folder WHERE parent_folder_id IS NULL ORDER BY name"
        : "SELECT * FROM folder WHERE parent_folder_id = @parentFolderId ORDER BY name"
    if (parentFolderId !== null) {
      request.input("parentFolderId", parentFolderId)
    }
    const result = await request.query<FolderRow>(query)
    return result.recordset.map(toFolder)
  }

  async findById(folderId: number): Promise<Folder | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("folderId", folderId)
      .query<FolderRow>("SELECT * FROM folder WHERE folder_id = @folderId")
    const row = result.recordset[0]
    return row ? toFolder(row) : undefined
  }

  async create(name: string, parentFolderId: number | null): Promise<Folder> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("name", name)
      .input("parentFolderId", parentFolderId).query<{ folder_id: number }>(`
        INSERT INTO folder (name, parent_folder_id)
        OUTPUT inserted.folder_id
        VALUES (@name, @parentFolderId)
      `)
    const created = await this.findById(result.recordset[0].folder_id)
    if (!created) {
      throw new Error("フォルダの作成に失敗しました")
    }
    return created
  }
}
