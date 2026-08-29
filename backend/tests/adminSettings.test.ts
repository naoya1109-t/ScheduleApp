import { describe, expect, it } from "vitest"
import { CalendarService } from "../src/modules/calendar/calendarService.js"
import { PostService } from "../src/modules/board/postService.js"
import { TopPageService } from "../src/modules/topPage/topPageService.js"
import { FakeEventRepository } from "./fakeEventRepository.js"
import { FakeGroupRepository } from "./fakeGroupRepository.js"
import { FakeOperationLogRepository } from "./fakeOperationLogRepository.js"
import { FakePostRepository } from "./fakePostRepository.js"
import { FakeTopPageSettingsRepository } from "./fakeTopPageSettingsRepository.js"
import { FakeUserRepository } from "./fakeUserRepository.js"

describe("トップ画面表示件数設定", () => {
  it("管理者が設定した値が取得できる", async () => {
    const eventRepository = new FakeEventRepository()
    const calendarService = new CalendarService(eventRepository)
    const groupRepository = new FakeGroupRepository()
    const userRepository = new FakeUserRepository()
    const settingsRepository = new FakeTopPageSettingsRepository()
    const service = new TopPageService(calendarService, groupRepository, userRepository, settingsRepository)

    await service.updateSettings({ boardDisplayCount: 10, fileDisplayCount: 3 })
    const settings = await service.getSettings()

    expect(settings).toEqual({ boardDisplayCount: 10, fileDisplayCount: 3 })
  })
})

describe("グループメンバー表示順設定", () => {
  it("管理画面での並び替えが一覧に反映される", async () => {
    const groupRepository = new FakeGroupRepository()
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.seedMember(1, 10, "スタッフA")
    groupRepository.seedMember(1, 11, "スタッフB")

    await groupRepository.setMemberOrder(1, [
      { userId: 11, displayOrder: 1 },
      { userId: 10, displayOrder: 2 },
    ])

    const members = await groupRepository.listMembersOrdered(1)
    expect(members.map((m) => m.name)).toEqual(["スタッフB", "スタッフA"])
  })
})

describe("掲示板の一括削除", () => {
  function setup() {
    const repository = new FakePostRepository()
    const log = new FakeOperationLogRepository()
    const service = new PostService(repository, log, "./tmp-test-storage")
    repository.setAuthorName(1, "山田太郎")
    return { repository, log, service }
  }

  it("プレビューは削除を実行せず対象件数だけ返す", async () => {
    const { repository, service } = setup()
    await service.createPost({
      authorId: 1,
      title: "古い投稿",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })

    const preview = await service.previewBulkDelete("2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z")

    expect(preview.count).toBe(1)
    expect(repository.posts).toHaveLength(1)
  })

  it("範囲外の投稿はプレビュー・削除の対象にならない", async () => {
    const { service } = setup()
    await service.createPost({
      authorId: 1,
      title: "最近の投稿",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })

    const preview = await service.previewBulkDelete("1999-01-01T00:00:00.000Z", "1999-12-31T00:00:00.000Z")
    expect(preview.count).toBe(0)
  })

  it("実行すると対象投稿が削除され、操作ログにFrom-Toの範囲が記録される", async () => {
    const { repository, log, service } = setup()
    await service.createPost({
      authorId: 1,
      title: "古い投稿1",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })
    await service.createPost({
      authorId: 1,
      title: "古い投稿2",
      bodyHtml: "<p>本文</p>",
      visibilityScope: "company",
      groupId: null,
    })

    const result = await service.executeBulkDelete(
      "2000-01-01T00:00:00.000Z",
      "2100-01-01T00:00:00.000Z",
      99,
    )

    expect(result.count).toBe(2)
    expect(repository.posts).toHaveLength(0)
    const bulkLog = log.records.find((r) => r.action === "bulk_delete")
    expect(bulkLog?.actorId).toBe(99)
    expect(bulkLog?.targetId).toBe("bulk:2000-01-01T00:00:00.000Z~2100-01-01T00:00:00.000Z")
  })
})
