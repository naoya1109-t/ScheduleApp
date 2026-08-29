import type {
  UpdateUserInput,
  User,
  UserRepository,
  UserStatus,
  UserSummary,
} from "../../modules/users/types.js"

function toSummary(user: User): UserSummary {
  const { passwordHash: _passwordHash, ...summary } = user
  return summary
}

export class FakeUserRepository implements UserRepository {
  private users: User[] = []
  private nextId = 1

  seed(user: Omit<User, "userId">): User {
    const created: User = { ...user, userId: this.nextId++ }
    this.users.push(created)
    return created
  }

  async findByLoginId(loginId: string): Promise<User | undefined> {
    return this.users.find((user) => user.loginId === loginId)
  }

  async findById(userId: number): Promise<User | undefined> {
    return this.users.find((user) => user.userId === userId)
  }

  async list(): Promise<UserSummary[]> {
    return this.users.map(toSummary)
  }

  async create(input: {
    loginId: string
    passwordHash: string
    name: string
    email: string | null
    employeeNo: string | null
    role: User["role"]
    groupIds: number[]
  }): Promise<UserSummary> {
    const created = this.seed({
      loginId: input.loginId,
      passwordHash: input.passwordHash,
      name: input.name,
      email: input.email,
      employeeNo: input.employeeNo,
      role: input.role,
      status: "active",
    })
    return toSummary(created)
  }

  async update(userId: number, input: UpdateUserInput): Promise<UserSummary> {
    const user = this.users.find((candidate) => candidate.userId === userId)
    if (!user) {
      throw new Error("利用者が見つかりません")
    }
    if (input.name !== undefined) user.name = input.name
    if (input.email !== undefined) user.email = input.email
    if (input.employeeNo !== undefined) user.employeeNo = input.employeeNo
    if (input.role !== undefined) user.role = input.role
    return toSummary(user)
  }

  async setStatus(userId: number, status: UserStatus): Promise<void> {
    const user = this.users.find((candidate) => candidate.userId === userId)
    if (!user) {
      throw new Error("利用者が見つかりません")
    }
    user.status = status
  }
}
