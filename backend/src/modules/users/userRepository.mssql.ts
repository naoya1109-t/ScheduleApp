import type { ConnectionPool } from "mssql"
import type { User, UserRepository, UserRole, UserStatus, UserSummary } from "./types.js"

interface UserRow {
  user_id: number
  login_id: string
  password_hash: string
  name: string
  email: string | null
  employee_no: string | null
  role: UserRole
  status: UserStatus
  job_title_id: number | null
}

function toUser(row: UserRow): User {
  return {
    userId: row.user_id,
    loginId: row.login_id,
    passwordHash: row.password_hash,
    name: row.name,
    email: row.email,
    employeeNo: row.employee_no,
    role: row.role,
    status: row.status,
    jobTitleId: row.job_title_id,
  }
}

function toSummary(user: User): UserSummary {
  const { passwordHash: _passwordHash, ...summary } = user
  return summary
}

export class MssqlUserRepository implements UserRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async findByLoginId(loginId: string): Promise<User | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("loginId", loginId)
      .query<UserRow>("SELECT * FROM app_user WHERE login_id = @loginId")
    const row = result.recordset[0]
    return row ? toUser(row) : undefined
  }

  async findById(userId: number): Promise<User | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("userId", userId)
      .query<UserRow>("SELECT * FROM app_user WHERE user_id = @userId")
    const row = result.recordset[0]
    return row ? toUser(row) : undefined
  }

  async list(): Promise<UserSummary[]> {
    const pool = await this.getPool()
    const result = await pool.request().query<UserRow>("SELECT * FROM app_user ORDER BY name")
    return result.recordset.map((row) => toSummary(toUser(row)))
  }

  async create(input: {
    loginId: string
    passwordHash: string
    name: string
    email: string | null
    employeeNo: string | null
    role: UserRole
    groupIds: number[]
    jobTitleId: number | null
  }): Promise<UserSummary> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      const insertResult = await transaction
        .request()
        .input("loginId", input.loginId)
        .input("passwordHash", input.passwordHash)
        .input("name", input.name)
        .input("email", input.email)
        .input("employeeNo", input.employeeNo)
        .input("role", input.role)
        .input("jobTitleId", input.jobTitleId).query<{ user_id: number }>(`
          INSERT INTO app_user (login_id, password_hash, name, email, employee_no, role, job_title_id)
          OUTPUT inserted.user_id
          VALUES (@loginId, @passwordHash, @name, @email, @employeeNo, @role, @jobTitleId)
        `)
      const userId = insertResult.recordset[0].user_id

      for (const groupId of input.groupIds) {
        await transaction
          .request()
          .input("userId", userId)
          .input("groupId", groupId)
          .query("INSERT INTO user_group (user_id, group_id) VALUES (@userId, @groupId)")
      }

      await transaction.commit()
      const created = await this.findById(userId)
      if (!created) {
        throw new Error("利用者の作成に失敗しました")
      }
      return toSummary(created)
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async update(userId: number, input: import("./types.js").UpdateUserInput): Promise<UserSummary> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      const request = transaction.request().input("userId", userId)
      const assignments: string[] = []
      if (input.name !== undefined) {
        request.input("name", input.name)
        assignments.push("name = @name")
      }
      if (input.email !== undefined) {
        request.input("email", input.email)
        assignments.push("email = @email")
      }
      if (input.employeeNo !== undefined) {
        request.input("employeeNo", input.employeeNo)
        assignments.push("employee_no = @employeeNo")
      }
      if (input.role !== undefined) {
        request.input("role", input.role)
        assignments.push("role = @role")
      }
      if (input.jobTitleId !== undefined) {
        request.input("jobTitleId", input.jobTitleId)
        assignments.push("job_title_id = @jobTitleId")
      }
      if (assignments.length > 0) {
        await request.query(`UPDATE app_user SET ${assignments.join(", ")} WHERE user_id = @userId`)
      }

      if (input.groupIds !== undefined) {
        await transaction
          .request()
          .input("userId", userId)
          .query("DELETE FROM user_group WHERE user_id = @userId")
        for (const groupId of input.groupIds) {
          await transaction
            .request()
            .input("userId", userId)
            .input("groupId", groupId)
            .query("INSERT INTO user_group (user_id, group_id) VALUES (@userId, @groupId)")
        }
      }

      await transaction.commit()
      const updated = await this.findById(userId)
      if (!updated) {
        throw new Error("利用者が見つかりません")
      }
      return toSummary(updated)
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async setStatus(userId: number, status: UserStatus): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("userId", userId)
      .input("status", status)
      .query("UPDATE app_user SET status = @status WHERE user_id = @userId")
  }
}
