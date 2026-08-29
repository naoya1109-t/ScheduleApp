import { describe, expect, it } from "vitest"
import { FakeGroupRepository } from "./fakeGroupRepository.js"

describe("FakeGroupRepository", () => {
  it("グループを作成・更新・削除できる", async () => {
    const repository = new FakeGroupRepository()
    const created = await repository.create({ name: "営業部" })
    expect(created.name).toBe("営業部")

    const updated = await repository.update(created.groupId, { name: "営業推進部" })
    expect(updated.name).toBe("営業推進部")

    await repository.delete(created.groupId)
    expect(await repository.findById(created.groupId)).toBeUndefined()
  })

  it("メンバーを追加・削除できる", async () => {
    const repository = new FakeGroupRepository()
    repository.setUserName(10, "スタッフA")
    repository.setUserName(11, "スタッフB")
    const group = await repository.create({ name: "営業部" })

    await repository.addMember(group.groupId, 10)
    await repository.addMember(group.groupId, 11)
    expect((await repository.listMembersOrdered(group.groupId)).map((m) => m.userId)).toEqual([10, 11])

    await repository.removeMember(group.groupId, 10)
    expect((await repository.listMembersOrdered(group.groupId)).map((m) => m.userId)).toEqual([11])
  })

  it("同じユーザーを重複して追加しない", async () => {
    const repository = new FakeGroupRepository()
    repository.setUserName(10, "スタッフA")
    const group = await repository.create({ name: "営業部" })

    await repository.addMember(group.groupId, 10)
    await repository.addMember(group.groupId, 10)

    expect(await repository.listMembersOrdered(group.groupId)).toHaveLength(1)
  })
})
