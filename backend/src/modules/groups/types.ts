export interface Group {
  groupId: number
  name: string
}

export interface CreateGroupInput {
  name: string
}

export interface GroupMember {
  userId: number
  name: string
  displayOrder: number | null
}

export interface MemberOrderEntry {
  userId: number
  displayOrder: number
}

export interface GroupRepository {
  listAll(): Promise<Group[]>
  listGroupsForUser(userId: number): Promise<Group[]>
  findById(groupId: number): Promise<Group | undefined>
  create(input: CreateGroupInput): Promise<Group>
  update(groupId: number, input: CreateGroupInput): Promise<Group>
  /** グループを参照している投稿がある場合はHttpError(409)を投げる */
  delete(groupId: number): Promise<void>
  listMembersOrdered(groupId: number): Promise<GroupMember[]>
  addMember(groupId: number, userId: number, name?: string): Promise<void>
  removeMember(groupId: number, userId: number): Promise<void>
  setMemberOrder(groupId: number, orders: MemberOrderEntry[]): Promise<void>
}
