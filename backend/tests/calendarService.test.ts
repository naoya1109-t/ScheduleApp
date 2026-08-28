import { describe, expect, it } from "vitest"
import { CalendarService } from "../src/modules/calendar/calendarService.js"
import { HttpError } from "../src/middleware/httpError.js"
import { FakeEventRepository } from "./fakeEventRepository.js"

const RANGE_FROM = "2026-09-01T00:00:00.000Z"
const RANGE_TO = "2026-09-07T23:59:59.000Z"

function setup() {
  const repository = new FakeEventRepository()
  const service = new CalendarService(repository)
  return { repository, service }
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
