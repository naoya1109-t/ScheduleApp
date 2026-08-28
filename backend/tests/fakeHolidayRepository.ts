import type {
  CreateHolidayInput,
  Holiday,
  HolidayRepository,
  UpdateHolidayInput,
} from "../src/modules/holidays/types.js"

export class FakeHolidayRepository implements HolidayRepository {
  holidays: Holiday[] = []
  private nextId = 1

  async listByYear(fiscalYear: number): Promise<Holiday[]> {
    return this.holidays.filter((holiday) => holiday.fiscalYear === fiscalYear)
  }

  async listInRange(from: string, to: string): Promise<Holiday[]> {
    return this.holidays.filter((holiday) => holiday.holidayDate >= from && holiday.holidayDate <= to)
  }

  async findByDate(holidayDate: string): Promise<Holiday | undefined> {
    return this.holidays.find((holiday) => holiday.holidayDate === holidayDate)
  }

  async create(input: CreateHolidayInput): Promise<Holiday> {
    const holiday: Holiday = { ...input, holidayId: this.nextId++ }
    this.holidays.push(holiday)
    return holiday
  }

  async update(holidayId: number, input: UpdateHolidayInput): Promise<Holiday> {
    const holiday = this.holidays.find((candidate) => candidate.holidayId === holidayId)
    if (!holiday) {
      throw new Error("祝日が見つかりません")
    }
    Object.assign(holiday, input)
    return holiday
  }

  async delete(holidayId: number): Promise<void> {
    this.holidays = this.holidays.filter((holiday) => holiday.holidayId !== holidayId)
  }
}
