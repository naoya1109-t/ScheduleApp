import { HttpError } from "../../middleware/httpError.js"
import type { EventRepository } from "../calendar/types.js"
import type {
  CreateMeetingRoomInput,
  CreateReservationInput,
  MeetingRoom,
  Reservation,
  ReservationRepository,
  RoomRepository,
  UpdateReservationInput,
} from "./types.js"

export type CallerRole = "admin" | "general"

export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async listRooms(): Promise<MeetingRoom[]> {
    return this.roomRepository.listAll()
  }

  async createRoom(input: CreateMeetingRoomInput): Promise<MeetingRoom> {
    return this.roomRepository.create(input)
  }

  async listReservations(roomId: number | null, from: string, to: string): Promise<Reservation[]> {
    if (roomId !== null) {
      return this.reservationRepository.listByRoomAndRange(roomId, from, to)
    }
    return this.reservationRepository.listByRange(from, to)
  }

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const room = await this.roomRepository.findById(input.roomId)
    if (!room) {
      throw new HttpError(404, "会議室が見つかりません")
    }

    // 二重予約防止(同一会議室・同一時間帯)はリポジトリ側でトランザクション+ロックにより保証する
    const reservation = await this.reservationRepository.createWithConflictCheck(input)

    // 予約とカレンダー予定を連動表示するため、予約者本人のカレンダーにも同じ予定を反映する
    const linkedEvent = await this.eventRepository.create({
      ownerId: input.reserverId,
      title: `[${room.name}] ${input.title}`,
      startAt: input.startAt,
      endAt: input.endAt,
      visibility: "all",
      isHidden: false,
      isRecurring: false,
      recurrenceRule: "none",
      eventType: "personal",
    })
    await this.reservationRepository.setLinkedEvent(reservation.reservationId, linkedEvent.eventId)

    return { ...reservation, linkedEventId: linkedEvent.eventId }
  }

  async updateReservation(
    reservationId: number,
    callerId: number,
    callerRole: CallerRole,
    input: UpdateReservationInput,
  ): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new HttpError(404, "予約が見つかりません")
    }
    this.assertCanModify(reservation, callerId, callerRole)

    const updated = await this.reservationRepository.updateWithConflictCheck(reservationId, input)

    if (reservation.linkedEventId && (input.startAt !== undefined || input.endAt !== undefined)) {
      await this.eventRepository.update(reservation.linkedEventId, {
        startAt: input.startAt,
        endAt: input.endAt,
      })
    }

    return updated
  }

  async deleteReservation(reservationId: number, callerId: number, callerRole: CallerRole): Promise<void> {
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new HttpError(404, "予約が見つかりません")
    }
    this.assertCanModify(reservation, callerId, callerRole)

    await this.reservationRepository.delete(reservationId)
    if (reservation.linkedEventId) {
      await this.eventRepository.delete(reservation.linkedEventId)
    }
  }

  private assertCanModify(reservation: Reservation, callerId: number, callerRole: CallerRole): void {
    if (reservation.reserverId !== callerId && callerRole !== "admin") {
      throw new HttpError(403, "この予約を変更する権限がありません")
    }
  }
}
