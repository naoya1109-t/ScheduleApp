import { describe, expect, it } from "vitest"
import { CalendarService } from "../src/modules/calendar/calendarService.js"
import { HttpError } from "../src/middleware/httpError.js"
import { FakeEventRepository } from "./fakeEventRepository.js"
import { FakeGroupRepository } from "./fakeGroupRepository.js"

const RANGE_FROM = "2026-09-01T00:00:00.000Z"
const RANGE_TO = "2026-09-07T23:59:59.000Z"

function setup() {
  const repository = new FakeEventRepository()
  const groupRepository = new FakeGroupRepository()
  const service = new CalendarService(repository, groupRepository)
  return { repository, groupRepository, service }
}

describe("CalendarService 公開対象・非表示のマスキングルール", () => {
  it("公開対象「自分」の予定は本人以外には一切見えない", async () => {
    const { service } = setup()
    await service.createEvent({
      ownerId: 1,
      title: "非公開の予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "self",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const asOwner = await service.listVisibleEvents(1, 1, RANGE_FROM, RANGE_TO)
    const asOther = await service.listVisibleEvents(1, 2, RANGE_FROM, RANGE_TO)

    expect(asOwner).toHaveLength(1)
    expect(asOwner[0].title).toBe("非公開の予定")
    expect(asOther).toHaveLength(0)
  })

  it("公開対象「全員」かつ非表示OFFは、他人にもタイトルが見える", async () => {
    const { service } = setup()
    await service.createEvent({
      ownerId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const asOther = await service.listVisibleEvents(1, 2, RANGE_FROM, RANGE_TO)
    expect(asOther).toHaveLength(1)
    expect(asOther[0].title).toBe("定例MTG")
    expect(asOther[0].isBusyOnly).toBe(false)
  })

  it("公開対象「全員」かつ非表示ONは、他人には「予定あり」とだけ見える", async () => {
    const { service } = setup()
    await service.createEvent({
      ownerId: 1,
      title: "通院",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: true,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const asOther = await service.listVisibleEvents(1, 2, RANGE_FROM, RANGE_TO)
    const asOwner = await service.listVisibleEvents(1, 1, RANGE_FROM, RANGE_TO)

    expect(asOther[0].isBusyOnly).toBe(true)
    expect(asOther[0].title).toBeNull()
    // 本人には非表示チェックの有無に関わらず、常にタイトルが見える
    expect(asOwner[0].title).toBe("通院")
    expect(asOwner[0].isBusyOnly).toBe(false)
  })

  it("本人以外は他人の予定を更新できない", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await expect(
      service.updateEvent(created.eventId, 2, "general", { title: "改ざん" }),
    ).rejects.toThrow(HttpError)
  })

  it("本人以外は他人の予定を削除できない", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await expect(service.deleteEvent(created.eventId, 2, "general")).rejects.toThrow(HttpError)
  })

  it("本人は編集用に予定の詳細を取得できる", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "self",
      isHidden: true,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const fetched = await service.getEvent(created.eventId, 1, "general")
    expect(fetched.title).toBe("予定")
    expect(fetched.visibility).toBe("self")
  })

  it("本人以外は他人の予定の詳細を取得できない", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await expect(service.getEvent(created.eventId, 2, "general")).rejects.toThrow(HttpError)
  })

  it("本人は公開対象・非表示設定を後から変更できる", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await service.updateEvent(created.eventId, 1, "general", { isHidden: true })
    const asOther = await service.listVisibleEvents(1, 2, RANGE_FROM, RANGE_TO)
    expect(asOther[0].isBusyOnly).toBe(true)
  })
})

describe("CalendarService 会社休日", () => {
  it("会社休日は誰でも登録でき、公開対象「全員」・非表示OFF・繰り返しなしに固定される", async () => {
    const { repository, service } = setup()
    await service.createEvent({
      ownerId: 1,
      title: "夏季休暇",
      startAt: "2026-09-02T00:00:00.000Z",
      endAt: "2026-09-02T23:59:59.000Z",
      visibility: "self",
      isHidden: true,
      isRecurring: true,
      recurrenceRule: "weekly",
      eventType: "company_holiday",
    })

    const created = repository.events[0]
    expect(created.visibility).toBe("all")
    expect(created.isHidden).toBe(false)
    expect(created.isRecurring).toBe(false)
  })

  it("会社休日は入力者本人でなくても管理者なら編集・削除できる", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "夏季休暇",
      startAt: "2026-09-02T00:00:00.000Z",
      endAt: "2026-09-02T23:59:59.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
      eventType: "company_holiday",
    })

    await expect(
      service.updateEvent(created.eventId, 2, "admin", { title: "夏季休暇(修正)" }),
    ).resolves.not.toThrow()
    await expect(service.deleteEvent(created.eventId, 2, "admin")).resolves.not.toThrow()
  })

  it("会社休日は入力者本人でも一般社員でもない他人からは編集・削除できない", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 1,
      title: "夏季休暇",
      startAt: "2026-09-02T00:00:00.000Z",
      endAt: "2026-09-02T23:59:59.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
      eventType: "company_holiday",
    })

    await expect(
      service.updateEvent(created.eventId, 2, "general", { title: "改ざん" }),
    ).rejects.toThrow(HttpError)
  })

  it("会社休日はlistCompanyHolidaysで誰にでも見える(非表示扱いにならない)", async () => {
    const { service } = setup()
    await service.createEvent({
      ownerId: 1,
      title: "夏季休暇",
      startAt: "2026-09-02T00:00:00.000Z",
      endAt: "2026-09-02T23:59:59.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
      eventType: "company_holiday",
    })

    const holidays = await service.listCompanyHolidays(RANGE_FROM, RANGE_TO)
    expect(holidays).toHaveLength(1)
    expect(holidays[0].title).toBe("夏季休暇")
    expect(holidays[0].isBusyOnly).toBe(false)
  })
})

describe("CalendarService 他利用者への代理登録", () => {
  it("自分自身への登録は常に許可される", async () => {
    const { service } = setup()
    await expect(service.assertCanCreateForOwner(1, 1)).resolves.not.toThrow()
  })

  it("同じグループに所属していれば他人への代理登録が許可される", async () => {
    const { groupRepository, service } = setup()
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.seedMember(1, 1, "山田太郎")
    groupRepository.seedMember(1, 2, "鈴木花子")

    await expect(service.assertCanCreateForOwner(1, 2)).resolves.not.toThrow()
  })

  it("同じグループに所属していない他人への代理登録は拒否される", async () => {
    const { groupRepository, service } = setup()
    groupRepository.addGroup({ groupId: 1, name: "営業部" })
    groupRepository.addGroup({ groupId: 2, name: "総務部" })
    groupRepository.seedMember(1, 1, "山田太郎")
    groupRepository.seedMember(2, 2, "鈴木花子")

    await expect(service.assertCanCreateForOwner(1, 2)).rejects.toThrow(HttpError)
  })

  it("グループ情報が配線されていない場合、他人への代理登録は拒否される", async () => {
    const repository = new FakeEventRepository()
    const service = new CalendarService(repository)

    await expect(service.assertCanCreateForOwner(1, 2)).rejects.toThrow(HttpError)
  })

  it("代理登録した本人は、対象者の予定を後から編集・削除できる", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 2,
      createdBy: 1,
      title: "代理登録した予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await expect(
      service.updateEvent(created.eventId, 1, "general", { title: "代理登録した予定(修正)" }),
    ).resolves.not.toThrow()
    await expect(service.deleteEvent(created.eventId, 1, "general")).resolves.not.toThrow()
  })

  it("代理登録に関わっていない第三者は、対象者の予定を編集・削除できない", async () => {
    const { service } = setup()
    const created = await service.createEvent({
      ownerId: 2,
      createdBy: 1,
      title: "代理登録した予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    await expect(
      service.updateEvent(created.eventId, 3, "general", { title: "改ざん" }),
    ).rejects.toThrow(HttpError)
    await expect(service.deleteEvent(created.eventId, 3, "general")).rejects.toThrow(HttpError)
  })

  it("週表示のvisibleEventsで、代理登録した本人にはcanManage=trueが返る", async () => {
    const { service } = setup()
    await service.createEvent({
      ownerId: 2,
      createdBy: 1,
      title: "代理登録した予定",
      startAt: "2026-09-02T09:00:00.000Z",
      endAt: "2026-09-02T10:00:00.000Z",
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
    })

    const asCreator = await service.listVisibleEvents(2, 1, RANGE_FROM, RANGE_TO)
    const asOwner = await service.listVisibleEvents(2, 2, RANGE_FROM, RANGE_TO)
    const asOther = await service.listVisibleEvents(2, 3, RANGE_FROM, RANGE_TO)

    expect(asCreator[0].canManage).toBe(true)
    expect(asCreator[0].isOwnEvent).toBe(false)
    expect(asOwner[0].canManage).toBe(true)
    expect(asOther[0].canManage).toBe(false)
  })
})
