export interface MeetingRoom {
  roomId: number
  name: string
  capacity: number | null
  equipment: string | null
}

export interface CreateMeetingRoomInput {
  name: string
  capacity: number | null
  equipment: string | null
}

export interface Reservation {
  reservationId: number
  roomId: number
  reserverId: number
  reserverName: string
  title: string
  startAt: string
  endAt: string
  linkedEventId: number | null
}

export interface CreateReservationInput {
  roomId: number
  reserverId: number
  title: string
  startAt: string
  endAt: string
}

export interface UpdateReservationInput {
  startAt?: string
  endAt?: string
}

export interface RoomRepository {
  listAll(): Promise<MeetingRoom[]>
  findById(roomId: number): Promise<MeetingRoom | undefined>
  create(input: CreateMeetingRoomInput): Promise<MeetingRoom>
}

export interface ReservationRepository {
  listByRoomAndRange(roomId: number, from: string, to: string): Promise<Reservation[]>
  listByRange(from: string, to: string): Promise<Reservation[]>
  findById(reservationId: number): Promise<Reservation | undefined>
  /** 同一会議室・同一時間帯の重複がある場合はHttpError(409)を投げる */
  createWithConflictCheck(input: CreateReservationInput): Promise<Reservation>
  updateWithConflictCheck(reservationId: number, input: UpdateReservationInput): Promise<Reservation>
  setLinkedEvent(reservationId: number, eventId: number | null): Promise<void>
  delete(reservationId: number): Promise<void>
}
