import { HttpError } from "../../middleware/httpError.js"
import type {
  CreateReservationInput,
  Reservation,
  ReservationRepository,
  UpdateReservationInput,
} from "../../modules/rooms/types.js"

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart
}

export class FakeReservationRepository implements ReservationRepository {
  reservations: Reservation[] = []
  reserverNames = new Map<number, string>()
  private nextId = 1

  setReserverName(userId: number, name: string): void {
    this.reserverNames.set(userId, name)
  }

  async listByRoomAndRange(roomId: number, from: string, to: string): Promise<Reservation[]> {
    return this.reservations.filter(
      (reservation) => reservation.roomId === roomId && overlaps(reservation.startAt, reservation.endAt, from, to),
    )
  }

  async listByRange(from: string, to: string): Promise<Reservation[]> {
    return this.reservations.filter((reservation) => overlaps(reservation.startAt, reservation.endAt, from, to))
  }

  async findById(reservationId: number): Promise<Reservation | undefined> {
    return this.reservations.find((reservation) => reservation.reservationId === reservationId)
  }

  async createWithConflictCheck(input: CreateReservationInput): Promise<Reservation> {
    const conflict = this.reservations.some(
      (reservation) =>
        reservation.roomId === input.roomId && overlaps(reservation.startAt, reservation.endAt, input.startAt, input.endAt),
    )
    if (conflict) {
      throw new HttpError(409, "指定した時間帯は既に他の予約があります")
    }
    const reservation: Reservation = {
      reservationId: this.nextId++,
      roomId: input.roomId,
      reserverId: input.reserverId,
      reserverName: this.reserverNames.get(input.reserverId) ?? "unknown",
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      linkedEventId: null,
    }
    this.reservations.push(reservation)
    return reservation
  }

  async updateWithConflictCheck(reservationId: number, input: UpdateReservationInput): Promise<Reservation> {
    const reservation = this.reservations.find((candidate) => candidate.reservationId === reservationId)
    if (!reservation) {
      throw new HttpError(404, "予約が見つかりません")
    }
    const nextStartAt = input.startAt ?? reservation.startAt
    const nextEndAt = input.endAt ?? reservation.endAt
    const conflict = this.reservations.some(
      (candidate) =>
        candidate.reservationId !== reservationId &&
        candidate.roomId === reservation.roomId &&
        overlaps(candidate.startAt, candidate.endAt, nextStartAt, nextEndAt),
    )
    if (conflict) {
      throw new HttpError(409, "指定した時間帯は既に他の予約があります")
    }
    reservation.startAt = nextStartAt
    reservation.endAt = nextEndAt
    return reservation
  }

  async setLinkedEvent(reservationId: number, eventId: number | null): Promise<void> {
    const reservation = this.reservations.find((candidate) => candidate.reservationId === reservationId)
    if (reservation) {
      reservation.linkedEventId = eventId
    }
  }

  async delete(reservationId: number): Promise<void> {
    this.reservations = this.reservations.filter((reservation) => reservation.reservationId !== reservationId)
  }
}
