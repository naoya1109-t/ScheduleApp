import { describe, expect, it } from "vitest"
import { AuthService } from "../src/modules/auth/authService.js"
import { UserService } from "../src/modules/users/userService.js"
import { FakeUserRepository } from "./fakeUserRepository.js"

describe("AuthService", () => {
  it("正しいログインID・パスワードで認証できる", async () => {
    const repository = new FakeUserRepository()
    const userService = new UserService(repository)
    await userService.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })
    const authService = new AuthService(repository)

    const user = await authService.verifyCredentials("taro", "password123")
    expect(user?.loginId).toBe("taro")
  })

  it("パスワードが誤っている場合は認証に失敗する", async () => {
    const repository = new FakeUserRepository()
    const userService = new UserService(repository)
    await userService.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })
    const authService = new AuthService(repository)

    const user = await authService.verifyCredentials("taro", "wrong-password")
    expect(user).toBeUndefined()
  })

  it("退職済み(status=retired)の利用者はログインできない", async () => {
    const repository = new FakeUserRepository()
    const userService = new UserService(repository)
    const created = await userService.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })
    await userService.retireUser(created.userId)
    const authService = new AuthService(repository)

    const user = await authService.verifyCredentials("taro", "password123")
    expect(user).toBeUndefined()
  })

  it("存在しないログインIDでは認証に失敗する", async () => {
    const repository = new FakeUserRepository()
    const authService = new AuthService(repository)

    const user = await authService.verifyCredentials("nobody", "password123")
    expect(user).toBeUndefined()
  })
})
