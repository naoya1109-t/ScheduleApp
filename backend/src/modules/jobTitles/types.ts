export interface JobTitle {
  jobTitleId: number
  name: string
}

export interface CreateJobTitleInput {
  name: string
}

export interface JobTitleRepository {
  listAll(): Promise<JobTitle[]>
  findById(jobTitleId: number): Promise<JobTitle | undefined>
  create(input: CreateJobTitleInput): Promise<JobTitle>
  update(jobTitleId: number, input: CreateJobTitleInput): Promise<JobTitle>
  /** 役職を参照している利用者がいる場合はHttpError(409)を投げる */
  delete(jobTitleId: number): Promise<void>
}
