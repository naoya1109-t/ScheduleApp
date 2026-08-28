import type { Group, GroupMember, GroupRepository } from "../src/modules/groups/types.js"

export class FakeGroupRepository implements GroupRepository {
  groups: Group[] = []
  memberships = new Map<number, number[]>() // groupId -> userIds
  members = new Map<number, { name: string; displayOrder: number | null }>()

  addGroup(group: Group): void {
    this.groups.push(group)
  }

  addMember(groupId: number, userId: number, name: string, displayOrder: number | null = null): void {
    const existing = this.memberships.get(groupId) ?? []
    existing.push(userId)
    this.memberships.set(groupId, existing)
    this.members.set(userId, { name, displayOrder })
  }

  async listAll(): Promise<Group[]> {
    return this.groups
  }

  async listGroupsForUser(userId: number): Promise<Group[]> {
    return this.groups.filter((group) => (this.memberships.get(group.groupId) ?? []).includes(userId))
  }

  async listMembersOrdered(groupId: number): Promise<GroupMember[]> {
    const userIds = this.memberships.get(groupId) ?? []
    return userIds
      .map((userId) => {
        const info = this.members.get(userId)!
        return { userId, name: info.name, displayOrder: info.displayOrder }
      })
      .sort((a, b) => {
        if (a.displayOrder === null && b.displayOrder === null) return a.name.localeCompare(b.name)
        if (a.displayOrder === null) return 1
        if (b.displayOrder === null) return -1
        return a.displayOrder - b.displayOrder
      })
  }
}
