export interface Group {
  groupId: number
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
  listMembersOrdered(groupId: number): Promise<GroupMember[]>
  setMemberOrder(groupId: number, orders: MemberOrderEntry[]): Promise<void>
}
