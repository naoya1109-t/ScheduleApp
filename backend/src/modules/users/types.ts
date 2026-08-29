export type UserRole = "admin" | "general"
export type UserStatus = "active" | "retired"

export interface User {
  userId: number
  loginId: string
  passwordHash: string
  name: string
  email: string | null
  employeeNo: string | null
  role: UserRole
  status: UserStatus
  jobTitleId: number | null
}

export type UserSummary = Omit<User, "passwordHash">

export interface CreateUserInput {
  loginId: string
  password: string
  name: string
  email?: string | null
  employeeNo?: string | null
  role: UserRole
  groupIds: number[]
  jobTitleId?: number | null
}

export interface UpdateUserInput {
  name?: string
  email?: string | null
  employeeNo?: string | null
  role?: UserRole
  groupIds?: number[]
  jobTitleId?: number | null
}

export interface UserRepository {
  findByLoginId(loginId: string): Promise<User | undefined>
  findById(userId: number): Promise<User | undefined>
  list(): Promise<UserSummary[]>
  create(input: {
    loginId: string
    passwordHash: string
    name: string
    email: string | null
    employeeNo: string | null
    role: UserRole
    groupIds: number[]
    jobTitleId: number | null
  }): Promise<UserSummary>
  update(userId: number, input: UpdateUserInput): Promise<UserSummary>
  setStatus(userId: number, status: UserStatus): Promise<void>
}
