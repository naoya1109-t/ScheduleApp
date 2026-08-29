import type { JapaneseHolidayEntry, JapaneseHolidaySource } from "../src/modules/holidays/types.js"

export class FakeJapaneseHolidaySource implements JapaneseHolidaySource {
  private byYear = new Map<number, JapaneseHolidayEntry[]>()

  setYear(fiscalYear: number, entries: JapaneseHolidayEntry[]): void {
    this.byYear.set(fiscalYear, entries)
  }

  async fetchYear(fiscalYear: number): Promise<JapaneseHolidayEntry[]> {
    return this.byYear.get(fiscalYear) ?? []
  }
}
