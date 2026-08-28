import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../../api/client"
import { createHoliday, deleteHoliday, listHolidaysByYear, type Holiday } from "../../../api/holidays"

const currentYear = new Date().getFullYear()

export function HolidaysPage() {
  const [year, setYear] = useState(currentYear)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayDate, setHolidayDate] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function reload(targetYear: number) {
    setHolidays(await listHolidaysByYear(targetYear))
  }

  useEffect(() => {
    let cancelled = false
    listHolidaysByYear(year).then((data) => {
      if (!cancelled) setHolidays(data)
    })
    return () => {
      cancelled = true
    }
  }, [year])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createHoliday({ holidayDate, name, fiscalYear: year })
      setHolidayDate("")
      setName("")
      await reload(year)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "祝日の登録に失敗しました")
    }
  }

  async function handleDelete(holidayId: number) {
    await deleteHoliday(holidayId)
    await reload(year)
  }

  return (
    <div className="mx-auto max-w-[700px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">祝日設定</h1>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-[11.5px] font-bold text-text-soft">年度</label>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-6 flex items-end gap-3 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">日付</label>
          <input
            type="date"
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">祝日名</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          追加
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      <div className="flex flex-col gap-2">
        {holidays.map((holiday) => (
          <div
            key={holiday.holidayId}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <span>
              {holiday.holidayDate} ・ {holiday.name}
            </span>
            <button onClick={() => handleDelete(holiday.holidayId)} className="text-coral">
              削除
            </button>
          </div>
        ))}
        {holidays.length === 0 && <p className="text-text-soft">{year}年の祝日は登録されていません。</p>}
      </div>
    </div>
  )
}
