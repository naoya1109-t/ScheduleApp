import type { ConnectionPool } from "mssql"
import type { CreateHolidayInput, Holiday, HolidayRepository, UpdateHolidayInput } from "./types.js"

interface HolidayRow {
  holiday_id: number
  holiday_date: string
  name: string
  fiscal_year: number
}

function toHoliday(row: HolidayRow): Holiday {
  return {
    holidayId: row.holiday_id,
    holidayDate: row.holiday_date,
    name: row.name,
    fiscalYear: row.fiscal_year,
  }
}

export class MssqlHolidayRepository implements HolidayRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listByYear(fiscalYear: number): Promise<Holiday[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("fiscalYear", fiscalYear)
      .query<HolidayRow>("SELECT * FROM holiday WHERE fiscal_year = @fiscalYear ORDER BY holiday_date")
    return result.recordset.map(toHoliday)
  }

  async listInRange(from: string, to: string): Promise<Holiday[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("from", from)
      .input("to", to)
      .query<HolidayRow>(
        "SELECT * FROM holiday WHERE holiday_date >= @from AND holiday_date <= @to ORDER BY holiday_date",
      )
    return result.recordset.map(toHoliday)
  }

  async findByDate(holidayDate: string): Promise<Holiday | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("holidayDate", holidayDate)
      .query<HolidayRow>("SELECT * FROM holiday WHERE holiday_date = @holidayDate")
    const row = result.recordset[0]
    return row ? toHoliday(row) : undefined
  }

  async create(input: CreateHolidayInput): Promise<Holiday> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("holidayDate", input.holidayDate)
      .input("name", input.name)
      .input("fiscalYear", input.fiscalYear).query<{ holiday_id: number }>(`
        INSERT INTO holiday (holiday_date, name, fiscal_year)
        OUTPUT inserted.holiday_id
        VALUES (@holidayDate, @name, @fiscalYear)
      `)
    const created = await this.findByDate(input.holidayDate)
    if (!created) {
      throw new Error("祝日の作成に失敗しました")
    }
    return created
  }

  async update(holidayId: number, input: UpdateHolidayInput): Promise<Holiday> {
    const pool = await this.getPool()
    if (input.name !== undefined) {
      await pool
        .request()
        .input("holidayId", holidayId)
        .input("name", input.name)
        .query("UPDATE holiday SET name = @name WHERE holiday_id = @holidayId")
    }
    const result = await pool
      .request()
      .input("holidayId", holidayId)
      .query<HolidayRow>("SELECT * FROM holiday WHERE holiday_id = @holidayId")
    const row = result.recordset[0]
    if (!row) {
      throw new Error("祝日が見つかりません")
    }
    return toHoliday(row)
  }

  async delete(holidayId: number): Promise<void> {
    const pool = await this.getPool()
    await pool.request().input("holidayId", holidayId).query("DELETE FROM holiday WHERE holiday_id = @holidayId")
  }
}
