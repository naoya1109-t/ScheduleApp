import type { ConnectionPool } from "mssql"
import type { CreateOperationLogInput, OperationLogRepository } from "./types.js"

export class MssqlOperationLogRepository implements OperationLogRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async record(input: CreateOperationLogInput): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("actorId", input.actorId)
      .input("targetType", input.targetType)
      .input("targetId", input.targetId)
      .input("action", input.action)
      .query(`
        INSERT INTO operation_log (actor_id, target_type, target_id, action)
        VALUES (@actorId, @targetType, @targetId, @action)
      `)
  }
}
