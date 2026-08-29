import { describe, expect, it } from "vitest"
import { CalendarService } from "../src/modules/calendar/calendarService.js"
import { TopPageService } from "../src/modules/topPage/topPageService.js"
import { FakeEventRepository } from "./fakeEventRepository.js"
import { FakeGroupRepository } from "./fakeGroupRepository.js"
import { FakeTopPageSettingsRepository } from "./fakeTopPageSettingsRepository.js"
import { FakeUserRepository } from "./fakeUserRepository.js"

const RANGE_FROM = "2026-09-01T00:00:00.000Z"
const RANGE_TO = "2026-09-07T23:59:59.000Z"

function setup() {
  const eventRepository = new FakeEventRepository()
  const calendarService = new CalendarService(eventRepository)
  const groupRepository = new FakeGroupRepository()
  const userRepository = new FakeUserRepository()
  const settingsRepository = new FakeTopPageSettingsRepository()
  const service = new TopPageService(calendarService, groupRepository, userRepository, settingsRepository)
  return { eventRepository, calendarService, groupRepository, userRepository, settingsRepository, service }
}

describe("TopPageService", () => {
  it("groupId未指定の場合は本人の行だけを返す", async () => {
    const { userRepository, service } = setup()
    const self = userRepository.seed({
      loginId: "taro",
      passwordHash: "x",
      name: "山田太郎",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })

    const rows = await service.getWeekGantt(self.userId, null, RANGE_FROM, RANGE_TO)
    expect(rows).toHaveLength(1)
    expect(rows[0].isSelf).toBe(true)
    expect(rows[0].name).toBe("山田太郎")
  })

  it("groupIdを指定すると、本人行の下にグループメンバーの行が表示順通りに並ぶ", async () => {
    const { userRepository, groupRepository, service } = setup()
    const self = userRepository.seed({
      loginId: "taro",
      passwordHash: "x",
      name: "山田太郎",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    const memberB = userRepository.seed({
      loginId: "b",
      passwordHash: "x",
      name: "スタッフB",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    const memberA = userRepository.seed({
      loginId: "a",
      passwordHash: "x",
      name: "スタッフA",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.seedMember(1, self.userId, self.name)
    // 表示順は管理画面で手動設定される想定(要件3-8)。Aを先、Bを後にする
    groupRepository.seedMember(1, memberA.userId, memberA.name, 1)
    groupRepository.seedMember(1, memberB.userId, memberB.name, 2)

    const rows = await service.getWeekGantt(self.userId, 1, RANGE_FROM, RANGE_TO)

    expect(rows.map((r) => r.name)).toEqual(["山田太郎", "スタッフA", "スタッフB"])
    expect(rows[0].isSelf).toBe(true)
    expect(rows[1].isSelf).toBe(false)
  })

  it("グループメンバーに本人が含まれていても重複表示しない", async () => {
    const { userRepository, groupRepository, service } = setup()
    const self = userRepository.seed({
      loginId: "taro",
      passwordHash: "x",
      name: "山田太郎",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.seedMember(1, self.userId, self.name, 1)

    const rows = await service.getWeekGantt(self.userId, 1, RANGE_FROM, RANGE_TO)
    expect(rows).toHaveLength(1)
  })

  it("メンバーの予定にも公開対象・非表示ルールが適用される", async () => {
    const { userRepository, groupRepository, calendarService, service } = setup()
    const self = userRepository.seed({
      loginId: "taro",
      passwordHash: "x",
      name: "山田太郎",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    const member = userRepository.seed({
      loginId: "b",
      passwordHash: "x",
      name: "スタッフB",
      email: null,
      employeeNo: null,
      role: "general",
      status: "active",
      jobTitleId: null,
    })
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.seedMember(1, self.userId, self.name)
    groupRepository.seedMember(1, member.userId, member.name, 1)
    await calendarService.createEvent({
      ownerId: member.userId,
      title: "通院",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: true,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const rows = await service.getWeekGantt(self.userId, 1, RANGE_FROM, RANGE_TO)
    const memberRow = rows.find((r) => r.userId === member.userId)!
    expect(memberRow.occurrences[0].isBusyOnly).toBe(true)
    expect(memberRow.occurrences[0].title).toBeNull()
  })

  it("表示件数設定を取得できる", async () => {
    const { settingsRepository, service } = setup()
    settingsRepository.settings = { boardDisplayCount: 3, fileDisplayCount: 7 }
    const settings = await service.getSettings()
    expect(settings).toEqual({ boardDisplayCount: 3, fileDisplayCount: 7 })
  })
})
