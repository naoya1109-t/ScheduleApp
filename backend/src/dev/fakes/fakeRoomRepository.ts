import type {
  CreateMeetingRoomInput,
  MeetingRoom,
  RoomOrderEntry,
  RoomRepository,
  UpdateMeetingRoomInput,
} from "../../modules/rooms/types.js"

export class FakeRoomRepository implements RoomRepository {
  rooms: MeetingRoom[] = []
  private nextId = 1

  async listAll(): Promise<MeetingRoom[]> {
    return [...this.rooms].sort((a, b) => a.displayOrder - b.displayOrder || a.roomId - b.roomId)
  }

  async findById(roomId: number): Promise<MeetingRoom | undefined> {
    return this.rooms.find((room) => room.roomId === roomId)
  }

  async create(input: CreateMeetingRoomInput): Promise<MeetingRoom> {
    const maxOrder = this.rooms.reduce((max, room) => Math.max(max, room.displayOrder), 0)
    const room: MeetingRoom = { ...input, roomId: this.nextId++, displayOrder: maxOrder + 1 }
    this.rooms.push(room)
    return room
  }

  async update(roomId: number, input: UpdateMeetingRoomInput): Promise<MeetingRoom> {
    const room = this.rooms.find((candidate) => candidate.roomId === roomId)
    if (!room) {
      throw new Error("会議室が見つかりません")
    }
    if (input.name !== undefined) room.name = input.name
    if (input.memo !== undefined) room.memo = input.memo
    return room
  }

  async delete(roomId: number): Promise<void> {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId)
  }

  async setOrder(orders: RoomOrderEntry[]): Promise<void> {
    for (const order of orders) {
      const room = this.rooms.find((candidate) => candidate.roomId === order.roomId)
      if (room) room.displayOrder = order.displayOrder
    }
  }
}
