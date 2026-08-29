import type { ConnectionPool } from "mssql"
import { HttpError } from "../../middleware/httpError.js"
import type { CreateGroupInput, Group, GroupMember, GroupRepository, MemberOrderEntry } from "./types.js"

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

  async findById(groupId: number): Promise<Group | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("groupId", groupId)
      .query<{ group_id: number; name: string }>("SELECT group_id, name FROM app_group WHERE group_id = @groupId")
    const row = result.recordset[0]
    return row ? { groupId: row.group_id, name: row.name } : undefined
  }

  async create(input: CreateGroupInput): Promise<Group> {
    const pool = await this.getPool()
    const result = await pool.request().input("name", input.name).query<{ group_id: number }>(`
      INSERT INTO app_group (name)
      OUTPUT inserted.group_id
      VALUES (@name)
    `)
    return { groupId: result.recordset[0].group_id, name: input.name }
  }

  async update(groupId: number, input: CreateGroupInput): Promise<Group> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("groupId", groupId)
      .input("name", input.name)
      .query("UPDATE app_group SET name = @name WHERE group_id = @groupId")
    const updated = await this.findById(groupId)
    if (!updated) {
      throw new Error("グループの更新に失敗しました")
    }
    return updated
  }

  async delete(groupId: number): Promise<void> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      await transaction
        .request()
        .input("groupId", groupId)
        .query("DELETE FROM group_member_order WHERE group_id = @groupId")
      await transaction.request().input("groupId", groupId).query("DELETE FROM user_group WHERE group_id = @groupId")
      await transaction.request().input("groupId", groupId).query("DELETE FROM app_group WHERE group_id = @groupId")
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      if ((error as { number?: number }).number === 547) {
        throw new HttpError(409, "このグループを参照している投稿があるため削除できません")
      }
      throw error
    }
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

  async addMember(groupId: number, userId: number): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("groupId", groupId)
      .input("userId", userId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM user_group WHERE group_id = @groupId AND user_id = @userId)
        INSERT INTO user_group (user_id, group_id) VALUES (@userId, @groupId)
      `)
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      await transaction
        .request()
        .input("groupId", groupId)
        .input("userId", userId)
        .query("DELETE FROM group_member_order WHERE group_id = @groupId AND user_id = @userId")
      await transaction
        .request()
        .input("groupId", groupId)
        .input("userId", userId)
        .query("DELETE FROM user_group WHERE group_id = @groupId AND user_id = @userId")
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async setMemberOrder(groupId: number, orders: MemberOrderEntry[]): Promise<void> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      await transaction.request().input("groupId", groupId).query("DELETE FROM group_member_order WHERE group_id = @groupId")
      for (const order of orders) {
        await transaction
          .request()
          .input("groupId", groupId)
          .input("userId", order.userId)
          .input("displayOrder", order.displayOrder)
          .query(
            "INSERT INTO group_member_order (group_id, user_id, display_order) VALUES (@groupId, @userId, @displayOrder)",
          )
      }
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
