import { HttpError } from "../../middleware/httpError.js"
import type { CalendarService } from "../calendar/calendarService.js"
import type { GroupRepository } from "../groups/types.js"
import type { UserRepository } from "../users/types.js"
import type { TopPageSettings, TopPageSettingsRepository, WeekGanttRow } from "./types.js"

export class TopPageService {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly groupRepository: GroupRepository,
    private readonly userRepository: UserRepository,
    private readonly settingsRepository: TopPageSettingsRepository,
  ) {}

  async getSettings(): Promise<TopPageSettings> {
    return this.settingsRepository.get()
  }

  async getWeekGantt(
    viewerId: number,
    groupId: number | null,
    from: string,
    to: string,
  ): Promise<WeekGanttRow[]> {
    const viewer = await this.userRepository.findById(viewerId)
    if (!viewer) {
      throw new HttpError(404, "利用者が見つかりません")
    }

    const members = groupId !== null ? await this.groupRepository.listMembersOrdered(groupId) : []

    const rows: Array<{ userId: number; name: string; isSelf: boolean }> = [
      { userId: viewer.userId, name: viewer.name, isSelf: true },
    ]
    for (const member of members) {
      if (member.userId !== viewer.userId) {
        rows.push({ userId: member.userId, name: member.name, isSelf: false })
      }
    }

    const result: WeekGanttRow[] = []
    for (const row of rows) {
      const occurrences = await this.calendarService.listVisibleEvents(row.userId, viewerId, from, to)
      result.push({ ...row, occurrences })
    }
    return result
  }
}
