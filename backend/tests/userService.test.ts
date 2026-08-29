import bcrypt from "bcrypt"
import { describe, expect, it } from "vitest"
import { UserService } from "../src/modules/users/userService.js"
import { FakeUserRepository } from "./fakeUserRepository.js"

describe("UserService", () => {
  it("パスワードをハッシュ化して保存し、平文を保持しない", async () => {
    const repository = new FakeUserRepository()
    const service = new UserService(repository)

    await service.createUser({
      loginId: "taro",
      password: "correct-horse-battery-staple",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })

    const stored = await repository.findByLoginId("taro")
    expect(stored).toBeDefined()
    expect(stored?.passwordHash).not.toBe("correct-horse-battery-staple")
    expect(await bcrypt.compare("correct-horse-battery-staple", stored!.passwordHash)).toBe(true)
  })

  it("退職処理でstatusをretiredにする(論理削除、レコードは残す)", async () => {
    const repository = new FakeUserRepository()
    const service = new UserService(repository)
    const created = await service.createUser({
      loginId: "hanako",
      password: "password123",
      name: "鈴木花子",
      role: "general",
      groupIds: [],
    })

    await service.retireUser(created.userId)

    const stored = await repository.findById(created.userId)
    expect(stored?.status).toBe("retired")
    expect(stored?.name).toBe("鈴木花子")
  })

  it("利用者一覧にパスワードハッシュを含めない", async () => {
    const repository = new FakeUserRepository()
    const service = new UserService(repository)
    await service.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })

    const users = await service.listUsers()
    expect(users[0]).not.toHaveProperty("passwordHash")
  })

  it("在籍中の利用者はディレクトリ詳細を取得でき、パスワードハッシュを含まない", async () => {
    const repository = new FakeUserRepository()
    const service = new UserService(repository)
    const created = await service.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      email: "taro@example.com",
      employeeNo: "0001",
      role: "general",
      groupIds: [],
    })

    const directoryUser = await service.getDirectoryUser(created.userId)
    expect(directoryUser).toEqual({
      userId: created.userId,
      name: "山田太郎",
      email: "taro@example.com",
      employeeNo: "0001",
      jobTitleId: null,
    })
  })

  it("退職済みの利用者のディレクトリ詳細はundefinedになる", async () => {
    const repository = new FakeUserRepository()
    const service = new UserService(repository)
    const created = await service.createUser({
      loginId: "taro",
      password: "password123",
      name: "山田太郎",
      role: "general",
      groupIds: [],
    })
    await service.retireUser(created.userId)

    expect(await service.getDirectoryUser(created.userId)).toBeUndefined()
  })
})
