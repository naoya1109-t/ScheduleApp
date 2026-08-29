import type { CreateGroupInput, Group, GroupMember, GroupRepository, MemberOrderEntry } from "../src/modules/groups/types.js"

export class FakeGroupRepository implements GroupRepository {
  groups: Group[] = []
  memberships = new Map<number, number[]>() // groupId -> userIds
  userNames = new Map<number, string>()
  displayOrders = new Map<string, number>() // key: `${groupId}:${userId}`
  private nextId = 1

  addGroup(group: Group): void {
    this.groups.push(group)
    if (group.groupId >= this.nextId) this.nextId = group.groupId + 1
  }

  setUserName(userId: number, name: string): void {
    this.userNames.set(userId, name)
  }

  /** テスト・シード用: メンバーと表示名/表示順をまとめて登録する */
  seedMember(groupId: number, userId: number, name: string, displayOrder: number | null = null): void {
    this.setUserName(userId, name)
    const existing = this.memberships.get(groupId) ?? []
    if (!existing.includes(userId)) existing.push(userId)
    this.memberships.set(groupId, existing)
    if (displayOrder !== null) {
      this.displayOrders.set(`${groupId}:${userId}`, displayOrder)
    }
  }

  async listAll(): Promise<Group[]> {
    return this.groups
  }

  async listGroupsForUser(userId: number): Promise<Group[]> {
    return this.groups.filter((group) => (this.memberships.get(group.groupId) ?? []).includes(userId))
  }

  async findById(groupId: number): Promise<Group | undefined> {
    return this.groups.find((group) => group.groupId === groupId)
  }

  async create(input: CreateGroupInput): Promise<Group> {
    const group: Group = { groupId: this.nextId++, name: input.name }
    this.groups.push(group)
    return group
  }

  async update(groupId: number, input: CreateGroupInput): Promise<Group> {
    const group = this.groups.find((candidate) => candidate.groupId === groupId)
    if (!group) {
      throw new Error("グループが見つかりません")
    }
    group.name = input.name
    return group
  }

  async delete(groupId: number): Promise<void> {
    this.groups = this.groups.filter((group) => group.groupId !== groupId)
    this.memberships.delete(groupId)
  }

  async addMember(groupId: number, userId: number): Promise<void> {
    const existing = this.memberships.get(groupId) ?? []
    if (!existing.includes(userId)) existing.push(userId)
    this.memberships.set(groupId, existing)
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    const existing = this.memberships.get(groupId) ?? []
    this.memberships.set(
      groupId,
      existing.filter((id) => id !== userId),
    )
  }

  async listMembersOrdered(groupId: number): Promise<GroupMember[]> {
    const userIds = this.memberships.get(groupId) ?? []
    return userIds
      .map((userId) => ({
        userId,
        name: this.userNames.get(userId) ?? "unknown",
        displayOrder: this.displayOrders.get(`${groupId}:${userId}`) ?? null,
      }))
      .sort((a, b) => {
        if (a.displayOrder === null && b.displayOrder === null) return a.name.localeCompare(b.name)
        if (a.displayOrder === null) return 1
        if (b.displayOrder === null) return -1
        return a.displayOrder - b.displayOrder
      })
  }

  async setMemberOrder(groupId: number, orders: MemberOrderEntry[]): Promise<void> {
    for (const order of orders) {
      this.displayOrders.set(`${groupId}:${order.userId}`, order.displayOrder)
    }
  }
}
