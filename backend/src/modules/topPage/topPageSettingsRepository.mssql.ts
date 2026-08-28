import type { ConnectionPool } from "mssql"
import type { TopPageSettings, TopPageSettingsRepository } from "./types.js"

export class MssqlTopPageSettingsRepository implements TopPageSettingsRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async get(): Promise<TopPageSettings> {
    const pool = await this.getPool()
    const result = await pool.request().query<{
      board_display_count: number
      file_display_count: number
    }>("SELECT TOP 1 board_display_count, file_display_count FROM top_page_setting ORDER BY setting_id")
    const row = result.recordset[0]
    return {
      boardDisplayCount: row?.board_display_count ?? 5,
      fileDisplayCount: row?.file_display_count ?? 5,
    }
  }
}
