import type {
  TopPageSettings,
  TopPageSettingsRepository,
  UpdateTopPageSettingsInput,
} from "../../modules/topPage/types.js"

export class FakeTopPageSettingsRepository implements TopPageSettingsRepository {
  settings: TopPageSettings = { boardDisplayCount: 5, fileDisplayCount: 5 }

  async get(): Promise<TopPageSettings> {
    return this.settings
  }

  async update(input: UpdateTopPageSettingsInput): Promise<TopPageSettings> {
    this.settings = { ...input }
    return this.settings
  }
}
