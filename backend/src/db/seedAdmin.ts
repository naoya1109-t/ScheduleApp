import { getPool } from "../config/db.js"
import { MssqlUserRepository } from "../modules/users/userRepository.mssql.js"
import { UserService } from "../modules/users/userService.js"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`)
  }
  return value
}

async function main(): Promise<void> {
  const loginId = requiredEnv("ADMIN_LOGIN_ID")
  const password = requiredEnv("ADMIN_PASSWORD")
  const name = requiredEnv("ADMIN_NAME")

  const userRepository = new MssqlUserRepository(getPool)
  const existing = await userRepository.findByLoginId(loginId)
  if (existing) {
    console.log(`既に存在します: ${loginId}`)
    return
  }

  const userService = new UserService(userRepository)
  const created = await userService.createUser({
    loginId,
    password,
    name,
    role: "admin",
    groupIds: [],
  })
  console.log(`管理者を作成しました: ${created.loginId} (user_id=${created.userId})`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
