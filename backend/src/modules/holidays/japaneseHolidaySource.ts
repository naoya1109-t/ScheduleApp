import { HttpError } from "../../middleware/httpError.js"
import type { JapaneseHolidayEntry, JapaneseHolidaySource } from "./types.js"

// holidays-jp(https://github.com/holidays-jp/holidays_jp)が公開している祝日API。
// 内閣府の祝日データを基にコミュニティが日次更新しており、認証不要で利用できる。
export class HttpJapaneseHolidaySource implements JapaneseHolidaySource {
  async fetchYear(fiscalYear: number): Promise<JapaneseHolidayEntry[]> {
    let response: Response
    try {
      response = await fetch(`https://holidays-jp.github.io/api/v1/${fiscalYear}/date.json`)
    } catch {
      throw new HttpError(502, "祝日情報の取得に失敗しました(通信エラー)")
    }
    if (!response.ok) {
      throw new HttpError(502, "祝日情報の取得に失敗しました")
    }
    const data = (await response.json()) as Record<string, string>
    return Object.entries(data).map(([date, name]) => ({ date, name }))
  }
}
