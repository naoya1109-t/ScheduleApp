import type { ConnectionPool } from "mssql"
import { HttpError } from "../../middleware/httpError.js"
import type { CreateJobTitleInput, JobTitle, JobTitleRepository } from "./types.js"

export class MssqlJobTitleRepository implements JobTitleRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listAll(): Promise<JobTitle[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .query<{ job_title_id: number; name: string }>("SELECT job_title_id, name FROM job_title ORDER BY name")
    return result.recordset.map((row) => ({ jobTitleId: row.job_title_id, name: row.name }))
  }

  async findById(jobTitleId: number): Promise<JobTitle | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("jobTitleId", jobTitleId)
      .query<{ job_title_id: number; name: string }>(
        "SELECT job_title_id, name FROM job_title WHERE job_title_id = @jobTitleId",
      )
    const row = result.recordset[0]
    return row ? { jobTitleId: row.job_title_id, name: row.name } : undefined
  }

  async create(input: CreateJobTitleInput): Promise<JobTitle> {
    const pool = await this.getPool()
    const result = await pool.request().input("name", input.name).query<{ job_title_id: number }>(`
      INSERT INTO job_title (name)
      OUTPUT inserted.job_title_id
      VALUES (@name)
    `)
    return { jobTitleId: result.recordset[0].job_title_id, name: input.name }
  }

  async update(jobTitleId: number, input: CreateJobTitleInput): Promise<JobTitle> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("jobTitleId", jobTitleId)
      .input("name", input.name)
      .query("UPDATE job_title SET name = @name WHERE job_title_id = @jobTitleId")
    const updated = await this.findById(jobTitleId)
    if (!updated) {
      throw new Error("役職の更新に失敗しました")
    }
    return updated
  }

  async delete(jobTitleId: number): Promise<void> {
    const pool = await this.getPool()
    try {
      await pool
        .request()
        .input("jobTitleId", jobTitleId)
        .query("DELETE FROM job_title WHERE job_title_id = @jobTitleId")
    } catch (error) {
      if ((error as { number?: number }).number === 547) {
        throw new HttpError(409, "この役職を設定している利用者がいるため削除できません")
      }
      throw error
    }
  }
}
