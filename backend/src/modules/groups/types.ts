export interface Group {
  groupId: number
  name: string
}

export interface GroupMember {
  userId: number
  name: string
  displayOrder: number | null
}

export interface GroupRepository {
  listAll(): Promise<Group[]>
  listGroupsForUser(userId: number): Promise<Group[]>
  listMembersOrdered(groupId: number): Promise<GroupMember[]>
}
