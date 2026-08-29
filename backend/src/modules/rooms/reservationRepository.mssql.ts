import sql, { type ConnectionPool } from "mssql"
import { HttpError } from "../../middleware/httpError.js"
import type {
  CreateReservationInput,
  Reservation,
  ReservationRepository,
  UpdateReservationInput,
} from "./types.js"

interface ReservationRow {
  reservation_id: number
  room_id: number
  reserver_id: number
  reserver_name: string
  title: string
  start_at: string
  end_at: string
  linked_event_id: number | null
}

function toReservation(row: ReservationRow): Reservation {
  return {
    reservationId: row.reservation_id,
    roomId: row.room_id,
    reserverId: row.reserver_id,
    reserverName: row.reserver_name,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    linkedEventId: row.linked_event_id,
  }
}

const RESERVATION_SELECT = `
  SELECT r.reservation_id, r.room_id, r.reserver_id, u.name AS reserver_name, r.title,
         r.start_at, r.end_at, r.linked_event_id
  FROM room_reservation r
  JOIN app_user u ON u.user_id = r.reserver_id
`

export class MssqlReservationRepository implements ReservationRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async listByRoomAndRange(roomId: number, from: string, to: string): Promise<Reservation[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("roomId", roomId)
      .input("from", from)
      .input("to", to)
      .query<ReservationRow>(
        `${RESERVATION_SELECT} WHERE r.room_id = @roomId AND r.start_at < @to AND r.end_at > @from ORDER BY r.start_at`,
      )
    return result.recordset.map(toReservation)
  }

  async listByRange(from: string, to: string): Promise<Reservation[]> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("from", from)
      .input("to", to)
      .query<ReservationRow>(
        `${RESERVATION_SELECT} WHERE r.start_at < @to AND r.end_at > @from ORDER BY r.start_at`,
      )
    return result.recordset.map(toReservation)
  }

  async findById(reservationId: number): Promise<Reservation | undefined> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("reservationId", reservationId)
      .query<ReservationRow>(`${RESERVATION_SELECT} WHERE r.reservation_id = @reservationId`)
    const row = result.recordset[0]
    return row ? toReservation(row) : undefined
  }

  async createWithConflictCheck(input: CreateReservationInput): Promise<Reservation> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)
    try {
      // UPDLOCK+HOLDLOCKで、同一会議室・重複時間帯の行をトランザクション終了まで
      // 排他的にロックし、並行リクエストによる二重予約を防ぐ
      const conflict = await transaction
        .request()
        .input("roomId", input.roomId)
        .input("startAt", input.startAt)
        .input("endAt", input.endAt).query<{ reservation_id: number }>(`
          SELECT reservation_id FROM room_reservation WITH (UPDLOCK, HOLDLOCK)
          WHERE room_id = @roomId AND start_at < @endAt AND end_at > @startAt
        `)
      if (conflict.recordset.length > 0) {
        throw new HttpError(409, "指定した時間帯は既に他の予約があります")
      }

      const insertResult = await transaction
        .request()
        .input("roomId", input.roomId)
        .input("reserverId", input.reserverId)
        .input("title", input.title)
        .input("startAt", input.startAt)
        .input("endAt", input.endAt).query<{ reservation_id: number }>(`
          INSERT INTO room_reservation (room_id, reserver_id, title, start_at, end_at)
          OUTPUT inserted.reservation_id
          VALUES (@roomId, @reserverId, @title, @startAt, @endAt)
        `)
      await transaction.commit()

      const created = await this.findById(insertResult.recordset[0].reservation_id)
      if (!created) {
        throw new Error("予約の作成に失敗しました")
      }
      return created
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async updateWithConflictCheck(reservationId: number, input: UpdateReservationInput): Promise<Reservation> {
    const pool = await this.getPool()
    const transaction = pool.transaction()
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)
    try {
      const currentResult = await transaction
        .request()
        .input("reservationId", reservationId)
        .query<{ room_id: number; start_at: string; end_at: string }>(
          "SELECT room_id, start_at, end_at FROM room_reservation WITH (UPDLOCK, HOLDLOCK) WHERE reservation_id = @reservationId",
        )
      const current = currentResult.recordset[0]
      if (!current) {
        throw new HttpError(404, "予約が見つかりません")
      }
      const nextStartAt = input.startAt ?? current.start_at
      const nextEndAt = input.endAt ?? current.end_at

      const conflict = await transaction
        .request()
        .input("roomId", current.room_id)
        .input("reservationId", reservationId)
        .input("startAt", nextStartAt)
        .input("endAt", nextEndAt).query<{ reservation_id: number }>(`
          SELECT reservation_id FROM room_reservation WITH (UPDLOCK, HOLDLOCK)
          WHERE room_id = @roomId AND reservation_id <> @reservationId
            AND start_at < @endAt AND end_at > @startAt
        `)
      if (conflict.recordset.length > 0) {
        throw new HttpError(409, "指定した時間帯は既に他の予約があります")
      }

      await transaction
        .request()
        .input("reservationId", reservationId)
        .input("startAt", nextStartAt)
        .input("endAt", nextEndAt)
        .query("UPDATE room_reservation SET start_at = @startAt, end_at = @endAt WHERE reservation_id = @reservationId")
      await transaction.commit()

      const updated = await this.findById(reservationId)
      if (!updated) {
        throw new Error("予約の更新に失敗しました")
      }
      return updated
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async setLinkedEvent(reservationId: number, eventId: number | null): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("reservationId", reservationId)
      .input("eventId", eventId)
      .query("UPDATE room_reservation SET linked_event_id = @eventId WHERE reservation_id = @reservationId")
  }

  async delete(reservationId: number): Promise<void> {
    const pool = await this.getPool()
    await pool
      .request()
      .input("reservationId", reservationId)
      .query("DELETE FROM room_reservation WHERE reservation_id = @reservationId")
  }

  async existsForRoom(roomId: number): Promise<boolean> {
    const pool = await this.getPool()
    const result = await pool
      .request()
      .input("roomId", roomId)
      .query<{ reservation_id: number }>("SELECT TOP 1 reservation_id FROM room_reservation WHERE room_id = @roomId")
    return result.recordset.length > 0
  }
}
