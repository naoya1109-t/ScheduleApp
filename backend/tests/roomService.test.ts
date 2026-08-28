import { describe, expect, it } from "vitest"
import { HttpError } from "../src/middleware/httpError.js"
import { RoomService } from "../src/modules/rooms/roomService.js"
import { FakeEventRepository } from "./fakeEventRepository.js"
import { FakeReservationRepository } from "./fakeReservationRepository.js"
import { FakeRoomRepository } from "./fakeRoomRepository.js"

function setup() {
  const roomRepository = new FakeRoomRepository()
  const reservationRepository = new FakeReservationRepository()
  const eventRepository = new FakeEventRepository()
  const service = new RoomService(roomRepository, reservationRepository, eventRepository)
  return { roomRepository, reservationRepository, eventRepository, service }
}

describe("RoomService", () => {
  it("同一会議室・同一時間帯への重複予約はエラーになる", async () => {
    const { roomRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })

    await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await expect(
      service.createReservation({
        roomId: room.roomId,
        reserverId: 2,
        title: "別件MTG",
        startAt: "2026-09-02T10:30:00.000Z",
        endAt: "2026-09-02T11:30:00.000Z",
      }),
    ).rejects.toThrow(HttpError)
  })

  it("時間帯が重ならなければ同じ会議室でも予約できる", async () => {
    const { roomRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })

    await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await expect(
      service.createReservation({
        roomId: room.roomId,
        reserverId: 2,
        title: "別件MTG",
        startAt: "2026-09-02T11:00:00.000Z",
        endAt: "2026-09-02T12:00:00.000Z",
      }),
    ).resolves.toBeDefined()
  })

  it("別の会議室であれば同じ時間帯でも予約できる", async () => {
    const { roomRepository, service } = setup()
    const roomA = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })
    const roomB = await roomRepository.create({ name: "会議室B", capacity: 4, equipment: null })

    await service.createReservation({
      roomId: roomA.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await expect(
      service.createReservation({
        roomId: roomB.roomId,
        reserverId: 2,
        title: "別件MTG",
        startAt: "2026-09-02T10:00:00.000Z",
        endAt: "2026-09-02T11:00:00.000Z",
      }),
    ).resolves.toBeDefined()
  })

  it("予約作成時に予約者のカレンダーへ連動する予定が作成される", async () => {
    const { roomRepository, eventRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })

    const reservation = await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    expect(reservation.linkedEventId).not.toBeNull()
    const linkedEvent = eventRepository.events.find((event) => event.eventId === reservation.linkedEventId)
    expect(linkedEvent?.title).toBe("[会議室A] 定例MTG")
    expect(linkedEvent?.ownerId).toBe(1)
  })

  it("予約を取り消すと連動していたカレンダー予定も削除される", async () => {
    const { roomRepository, eventRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })
    const reservation = await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await service.deleteReservation(reservation.reservationId, 1, "general")

    expect(eventRepository.events.find((event) => event.eventId === reservation.linkedEventId)).toBeUndefined()
  })

  it("予約者本人以外(一般社員)は予約を変更・取消できない", async () => {
    const { roomRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })
    const reservation = await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await expect(
      service.updateReservation(reservation.reservationId, 2, "general", { startAt: "2026-09-02T12:00:00.000Z" }),
    ).rejects.toThrow(HttpError)
    await expect(service.deleteReservation(reservation.reservationId, 2, "general")).rejects.toThrow(HttpError)
  })

  it("管理者は他人の予約でも変更・取消できる", async () => {
    const { roomRepository, service } = setup()
    const room = await roomRepository.create({ name: "会議室A", capacity: 6, equipment: null })
    const reservation = await service.createReservation({
      roomId: room.roomId,
      reserverId: 1,
      title: "定例MTG",
      startAt: "2026-09-02T10:00:00.000Z",
      endAt: "2026-09-02T11:00:00.000Z",
    })

    await expect(service.deleteReservation(reservation.reservationId, 999, "admin")).resolves.not.toThrow()
  })
})
