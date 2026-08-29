import { HttpError } from "../../middleware/httpError.js"
import type {
  CreateHolidayInput,
  Holiday,
  HolidayRepository,
  JapaneseHolidaySource,
  UpdateHolidayInput,
} from "./types.js"

export class HolidayService {
  constructor(
    private readonly repository: HolidayRepository,
    private readonly holidaySource: JapaneseHolidaySource,
  ) {}

  async listByYear(fiscalYear: number): Promise<Holiday[]> {
    return this.repository.listByYear(fiscalYear)
  }

  async listInRange(from: string, to: string): Promise<Holiday[]> {
    return this.repository.listInRange(from, to)
  }

  async createHoliday(input: CreateHolidayInput): Promise<Holiday> {
    const existing = await this.repository.findByDate(input.holidayDate)
    if (existing) {
      throw new HttpError(409, "この日付の祝日は既に登録されています")
    }
    return this.repository.create(input)
  }

  async updateHoliday(holidayId: number, input: UpdateHolidayInput): Promise<Holiday> {
    return this.repository.update(holidayId, input)
  }

  async deleteHoliday(holidayId: number): Promise<void> {
    await this.repository.delete(holidayId)
  }

  /** 既に登録済みの日付はスキップし、未登録の祝日のみ取り込む */
  async importJapaneseHolidays(fiscalYear: number): Promise<Holiday[]> {
    const entries = await this.holidaySource.fetchYear(fiscalYear)
    for (const entry of entries) {
      const existing = await this.repository.findByDate(entry.date)
      if (existing) continue
      await this.repository.create({ holidayDate: entry.date, name: entry.name, fiscalYear })
    }
    return this.repository.listByYear(fiscalYear)
  }
}
