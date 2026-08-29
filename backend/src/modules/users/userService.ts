import bcrypt from "bcrypt"
import type { CreateUserInput, UpdateUserInput, UserRepository, UserSummary } from "./types.js"

const SALT_ROUNDS = 12

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async listUsers(): Promise<UserSummary[]> {
    return this.repository.list()
  }

  /** 担当営業選択等のプルダウン用。管理者限定のlistUsersと異なり、一般社員も利用できる最小限の一覧 */
  async listActiveDirectory(): Promise<Array<{ userId: number; name: string }>> {
    const users = await this.repository.list()
    return users.filter((user) => user.status === "active").map((user) => ({ userId: user.userId, name: user.name }))
  }

  async createUser(input: CreateUserInput): Promise<UserSummary> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    return this.repository.create({
      loginId: input.loginId,
      passwordHash,
      name: input.name,
      email: input.email ?? null,
      employeeNo: input.employeeNo ?? null,
      role: input.role,
      groupIds: input.groupIds,
    })
  }

  async updateUser(userId: number, input: UpdateUserInput): Promise<UserSummary> {
    return this.repository.update(userId, input)
  }

  async retireUser(userId: number): Promise<void> {
    await this.repository.setStatus(userId, "retired")
  }

  async reactivateUser(userId: number): Promise<void> {
    await this.repository.setStatus(userId, "active")
  }
}
