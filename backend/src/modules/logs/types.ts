export interface CreateOperationLogInput {
  actorId: number
  targetType: string
  targetId: string
  action: string
}

export interface OperationLogRepository {
  record(input: CreateOperationLogInput): Promise<void>
}
