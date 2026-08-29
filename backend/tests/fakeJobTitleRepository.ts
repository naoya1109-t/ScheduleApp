import { HttpError } from "../src/middleware/httpError.js"
import type { CreateJobTitleInput, JobTitle, JobTitleRepository } from "../src/modules/jobTitles/types.js"

export class FakeJobTitleRepository implements JobTitleRepository {
  jobTitles: JobTitle[] = []
  private nextId = 1
  private referencedIds = new Set<number>()

  /** テスト用: この役職を参照している利用者がいる状態を再現する */
  markReferenced(jobTitleId: number): void {
    this.referencedIds.add(jobTitleId)
  }

  async listAll(): Promise<JobTitle[]> {
    return this.jobTitles
  }

  async findById(jobTitleId: number): Promise<JobTitle | undefined> {
    return this.jobTitles.find((jobTitle) => jobTitle.jobTitleId === jobTitleId)
  }

  async create(input: CreateJobTitleInput): Promise<JobTitle> {
    const jobTitle: JobTitle = { jobTitleId: this.nextId++, name: input.name }
    this.jobTitles.push(jobTitle)
    return jobTitle
  }

  async update(jobTitleId: number, input: CreateJobTitleInput): Promise<JobTitle> {
    const jobTitle = this.jobTitles.find((candidate) => candidate.jobTitleId === jobTitleId)
    if (!jobTitle) {
      throw new Error("役職が見つかりません")
    }
    jobTitle.name = input.name
    return jobTitle
  }

  async delete(jobTitleId: number): Promise<void> {
    if (this.referencedIds.has(jobTitleId)) {
      throw new HttpError(409, "この役職を設定している利用者がいるため削除できません")
    }
    this.jobTitles = this.jobTitles.filter((jobTitle) => jobTitle.jobTitleId !== jobTitleId)
  }
}
