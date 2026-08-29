import type { ConnectionPool } from "mssql"
import type { TopPageSettings, TopPageSettingsRepository, UpdateTopPageSettingsInput } from "./types.js"

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

  async update(input: UpdateTopPageSettingsInput): Promise<TopPageSettings> {
    const pool = await this.getPool()
    // 全社員共通の設定値を1行だけ保持する運用(要件3-3章)。行が無ければ作成する。
    await pool
      .request()
      .input("boardDisplayCount", input.boardDisplayCount)
      .input("fileDisplayCount", input.fileDisplayCount).query(`
        IF EXISTS (SELECT 1 FROM top_page_setting)
          UPDATE TOP (1) top_page_setting
          SET board_display_count = @boardDisplayCount, file_display_count = @fileDisplayCount
        ELSE
          INSERT INTO top_page_setting (board_display_count, file_display_count)
          VALUES (@boardDisplayCount, @fileDisplayCount)
      `)
    return this.get()
  }
}
