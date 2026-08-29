import { HttpError } from "../../middleware/httpError.js"
import type { CreateJobTitleInput, JobTitle, JobTitleRepository } from "../../modules/jobTitles/types.js"
import type { FakeUserRepository } from "./fakeUserRepository.js"

export class FakeJobTitleRepository implements JobTitleRepository {
  jobTitles: JobTitle[] = []
  private nextId = 1
  private userRepository: FakeUserRepository | null = null

  /** モックサーバー用: 削除時に利用者からの参照有無を実データで判定するための配線 */
  setUserRepository(userRepository: FakeUserRepository): void {
    this.userRepository = userRepository
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
    const isReferenced = this.userRepository?.listAllForReference().some((user) => user.jobTitleId === jobTitleId)
    if (isReferenced) {
      throw new HttpError(409, "この役職を設定している利用者がいるため削除できません")
    }
    this.jobTitles = this.jobTitles.filter((jobTitle) => jobTitle.jobTitleId !== jobTitleId)
  }
}
