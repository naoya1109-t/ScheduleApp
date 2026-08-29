import { describe, expect, it } from "vitest"
import { HttpError } from "../src/middleware/httpError.js"
import { FakeJobTitleRepository } from "./fakeJobTitleRepository.js"

describe("FakeJobTitleRepository", () => {
  it("役職を作成・更新・削除できる", async () => {
    const repository = new FakeJobTitleRepository()
    const created = await repository.create({ name: "部長" })
    expect(created.name).toBe("部長")

    const updated = await repository.update(created.jobTitleId, { name: "本部長" })
    expect(updated.name).toBe("本部長")

    await repository.delete(created.jobTitleId)
    expect(await repository.findById(created.jobTitleId)).toBeUndefined()
  })

  it("利用者が参照している役職は削除できない", async () => {
    const repository = new FakeJobTitleRepository()
    const created = await repository.create({ name: "部長" })
    repository.markReferenced(created.jobTitleId)

    await expect(repository.delete(created.jobTitleId)).rejects.toThrow(HttpError)
  })
})
