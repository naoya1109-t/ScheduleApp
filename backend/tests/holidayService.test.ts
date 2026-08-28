import { describe, expect, it } from "vitest"
import { HolidayService } from "../src/modules/holidays/holidayService.js"
import { HttpError } from "../src/middleware/httpError.js"
import { FakeHolidayRepository } from "./fakeHolidayRepository.js"

function setup() {
  const repository = new FakeHolidayRepository()
  const service = new HolidayService(repository)
  return { repository, service }
}

describe("HolidayService", () => {
  it("年度を指定して祝日一覧を取得できる", async () => {
    const { service } = setup()
    await service.createHoliday({ holidayDate: "2026-01-01", name: "元日", fiscalYear: 2026 })
    await service.createHoliday({ holidayDate: "2027-01-01", name: "元日", fiscalYear: 2027 })

    const holidays2026 = await service.listByYear(2026)
    expect(holidays2026).toHaveLength(1)
    expect(holidays2026[0].name).toBe("元日")
  })

  it("同じ日付の祝日は重複登録できない", async () => {
    const { service } = setup()
    await service.createHoliday({ holidayDate: "2026-01-01", name: "元日", fiscalYear: 2026 })

    await expect(
      service.createHoliday({ holidayDate: "2026-01-01", name: "元日(重複)", fiscalYear: 2026 }),
    ).rejects.toThrow(HttpError)
  })

  it("期間を指定して祝日を取得できる", async () => {
    const { service } = setup()
    await service.createHoliday({ holidayDate: "2026-01-01", name: "元日", fiscalYear: 2026 })
    await service.createHoliday({ holidayDate: "2026-01-12", name: "成人の日", fiscalYear: 2026 })
    await service.createHoliday({ holidayDate: "2026-02-11", name: "建国記念の日", fiscalYear: 2026 })

    const result = await service.listInRange("2026-01-01", "2026-01-31")
    expect(result.map((h) => h.name)).toEqual(["元日", "成人の日"])
  })

  it("祝日を削除できる", async () => {
    const { service, repository } = setup()
    const created = await service.createHoliday({ holidayDate: "2026-01-01", name: "元日", fiscalYear: 2026 })

    await service.deleteHoliday(created.holidayId)
    expect(repository.holidays).toHaveLength(0)
  })
})
