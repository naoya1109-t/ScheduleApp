import type { ConnectionPool } from "mssql"
import type { CreateMeetingRoomInput, MeetingRoom, RoomRepository, UpdateMeetingRoomInput } from "./types.js"

interface RoomRow {
  room_id: number
  name: string
  capacity: number | null
  equipment: string | null
}

function toRoom(row: RoomRow): MeetingRoom {
  return { roomId: row.room_id, name: row.name, capacity: row.capacity, equipment: row.equipment }
}

export class MssqlRoomRepository implements RoomRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listAll(): Promise<MeetingRoom[]> {
    const pool = await this.getPool()
    const result = await pool.request().query<RoomRow>("SELECT * FROM meeting_room ORDER BY name")
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
    const result = await pool
      .request()
      .input("name", input.name)
      .input("capacity", input.capacity)
      .input("equipment", input.equipment).query<{ room_id: number }>(`
        INSERT INTO meeting_room (name, capacity, equipment)
        OUTPUT inserted.room_id
        VALUES (@name, @capacity, @equipment)
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
    const capacity = input.capacity !== undefined ? input.capacity : existing.capacity
    const equipment = input.equipment !== undefined ? input.equipment : existing.equipment
    await pool
      .request()
      .input("roomId", roomId)
      .input("name", name)
      .input("capacity", capacity)
      .input("equipment", equipment)
      .query(
        "UPDATE meeting_room SET name = @name, capacity = @capacity, equipment = @equipment WHERE room_id = @roomId",
      )
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
}
