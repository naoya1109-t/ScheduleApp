import type { CreateOperationLogInput, OperationLogRepository } from "../src/modules/logs/types.js"

export class FakeOperationLogRepository implements OperationLogRepository {
  records: CreateOperationLogInput[] = []

  async record(input: CreateOperationLogInput): Promise<void> {
    this.records.push(input)
  }
}
