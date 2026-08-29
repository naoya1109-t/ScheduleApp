import type { ConnectionPool } from "mssql"
import type {
  CreateMeetingRoomInput,
  MeetingRoom,
  RoomOrderEntry,
  RoomRepository,
  UpdateMeetingRoomInput,
} from "./types.js"

interface RoomRow {
  room_id: number
  name: string
  memo: string | null
  display_order: number
}

function toRoom(row: RoomRow): MeetingRoom {
  return { roomId: row.room_id, name: row.name, memo: row.memo, displayOrder: row.display_order }
}

export class MssqlRoomRepository implements RoomRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listAll(): Promise<MeetingRoom[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .query<RoomRow>("SELECT * FROM meeting_room ORDER BY display_order, room_id")
    return result.recordset.map(toRoom)
  }

  async findById(roomId: number): Promise<MeetingRoom | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("roomId", roomId)
      .query<RoomRow>("SELECT * FROM meeting_room WHERE room_id = @roomId")
    const row = result.recordset[0]
    return row ? toRoom(row) : undefined
  }

  async create(input: CreateMeetingRoomInput): Promise<MeetingRoom> {
    const pool = await this.getPool()
    const maxOrderResult = await pool
      .request()
      .query<{ maxOrder: number | null }>("SELECT MAX(display_order) AS maxOrder FROM meeting_room")
    const nextOrder = (maxOrderResult.recordset[0].maxOrder ?? 0) + 1
    const result = await pool
      .request()
      .input("name", input.name)
      .input("memo", input.memo)
      .input("displayOrder", nextOrder).query<{ room_id: number }>(`
        INSERT INTO meeting_room (name, memo, display_order)
        OUTPUT inserted.room_id
        VALUES (@name, @memo, @displayOrder)
      `)
    const created = await this.findById(result.recordset[0].room_id)
    if (!created) {
      throw new Error("会議室の作成に失敗しました")
    }
    return created
  }

  async update(roomId: number, input: UpdateMeetingRoomInput): Promise<MeetingRoom> {
    const pool = await this.getPool()
    const existing = await this.findById(roomId)
    if (!existing) {
      throw new Error("会議室が見つかりません")
    }
    const name = input.name ?? existing.name
    const memo = input.memo !== undefined ? input.memo : existing.memo
    await pool
      .request()
      .input("roomId", roomId)
      .input("name", name)
      .input("memo", memo)
      .query("UPDATE meeting_room SET name = @name, memo = @memo WHERE room_id = @roomId")
    const updated = await this.findById(roomId)
    if (!updated) {
      throw new Error("会議室の更新に失敗しました")
    }
    return updated
  }

  async delete(roomId: number): Promise<void> {
    const pool = await this.getPool()
    await pool.request().input("roomId", roomId).query("DELETE FROM meeting_room WHERE room_id = @roomId")
  }

  async setOrder(orders: RoomOrderEntry[]): Promise<void> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin()
    try {
      for (const order of orders) {
        await transaction
          .request()
          .input("roomId", order.roomId)
          .input("displayOrder", order.displayOrder)
          .query("UPDATE meeting_room SET display_order = @displayOrder WHERE room_id = @roomId")
      }
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
