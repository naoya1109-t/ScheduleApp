import type { CreateMeetingRoomInput, MeetingRoom, RoomRepository } from "../../modules/rooms/types.js"

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
}
