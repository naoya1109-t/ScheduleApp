export interface Holiday {
  holidayId: number
  holidayDate: string
  name: string
  fiscalYear: number
}

export interface CreateHolidayInput {
  holidayDate: string
  name: string
  fiscalYear: number
}

export interface UpdateHolidayInput {
  name?: string
}

export interface HolidayRepository {
  listByYear(fiscalYear: number): Promise<Holiday[]>
  listInRange(from: string, to: string): Promise<Holiday[]>
  findByDate(holidayDate: string): Promise<Holiday | undefined>
  create(input: CreateHolidayInput): Promise<Holiday>
  update(holidayId: number, input: UpdateHolidayInput): Promise<Holiday>
  delete(holidayId: number): Promise<void>
}
