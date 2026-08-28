import type { ConnectionPool } from "mssql"
import type { Group, GroupMember, GroupRepository } from "./types.js"

export class MssqlGroupRepository implements GroupRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listAll(): Promise<Group[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .query<{ group_id: number; name: string }>("SELECT group_id, name FROM app_group ORDER BY name")
    return result.recordset.map((row) => ({ groupId: row.group_id, name: row.name }))
  }

  async listGroupsForUser(userId: number): Promise<Group[]> {
    const pool = await this.getPool()
    const result = await pool.request().input("userId", userId).query<{ group_id: number; name: string }>(`
      SELECT g.group_id, g.name
      FROM app_group g
      JOIN user_group ug ON ug.group_id = g.group_id
      WHERE ug.user_id = @userId
      ORDER BY g.name
    `)
    return result.recordset.map((row) => ({ groupId: row.group_id, name: row.name }))
  }

  async listMembersOrdered(groupId: number): Promise<GroupMember[]> {
    const pool = await this.getPool()
    const result = await pool.request().input("groupId", groupId).query<{
      user_id: number
      name: string
      display_order: number | null
    }>(`
      SELECT u.user_id, u.name, gmo.display_order
      FROM user_group ug
      JOIN app_user u ON u.user_id = ug.user_id
      LEFT JOIN group_member_order gmo ON gmo.group_id = ug.group_id AND gmo.user_id = ug.user_id
      WHERE ug.group_id = @groupId AND u.status = 'active'
      ORDER BY CASE WHEN gmo.display_order IS NULL THEN 1 ELSE 0 END, gmo.display_order, u.name
    `)
    return result.recordset.map((row) => ({
      userId: row.user_id,
      name: row.name,
      displayOrder: row.display_order,
    }))
  }
}
