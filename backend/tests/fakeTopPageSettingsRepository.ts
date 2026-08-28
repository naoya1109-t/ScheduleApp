import type { TopPageSettings, TopPageSettingsRepository } from "../src/modules/topPage/types.js"

export class FakeTopPageSettingsRepository implements TopPageSettingsRepository {
  settings: TopPageSettings = { boardDisplayCount: 5, fileDisplayCount: 5 }

  async get(): Promise<TopPageSettings> {
    return this.settings
  }
}
