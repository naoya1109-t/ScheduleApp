import type {
  CreateMeetingRoomInput,
  MeetingRoom,
  RoomRepository,
  UpdateMeetingRoomInput,
} from "../../modules/rooms/types.js"

export class FakeRoomRepository implements RoomRepository {
  rooms: MeetingRoom[] = []
  private nextId = 1

  async listAll(): Promise<MeetingRoom[]> {
    return this.rooms
  }

  async findById(roomId: number): Promise<MeetingRoom | undefined> {
    return this.rooms.find((room) => room.roomId === roomId)
  }

  async create(input: CreateMeetingRoomInput): Promise<MeetingRoom> {
    const room: MeetingRoom = { ...input, roomId: this.nextId++ }
    this.rooms.push(room)
    return room
  }

  async update(roomId: number, input: UpdateMeetingRoomInput): Promise<MeetingRoom> {
    const room = this.rooms.find((candidate) => candidate.roomId === roomId)
    if (!room) {
      throw new Error("会議室が見つかりません")
    }
    if (input.name !== undefined) room.name = input.name
    if (input.capacity !== undefined) room.capacity = input.capacity
    if (input.equipment !== undefined) room.equipment = input.equipment
    return room
  }

  async delete(roomId: number): Promise<void> {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId)
  }
}
