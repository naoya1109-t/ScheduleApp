import { apiFetch } from "./client"

export interface MeetingRoom {
  roomId: number
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

export function listRooms(): Promise<MeetingRoom[]> {
  return apiFetch<MeetingRoom[]>("/api/rooms")
}

export function createRoom(input: { name: string; capacity: number | null; equipment: string | null }) {
  return apiFetch<MeetingRoom>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateRoom(
  roomId: number,
  input: { name?: string; capacity?: number | null; equipment?: string | null },
) {
  return apiFetch<MeetingRoom>(`/api/rooms/${roomId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteRoom(roomId: number) {
  return apiFetch<void>(`/api/rooms/${roomId}`, { method: "DELETE" })
}

export function listReservations(roomId: number, from: string, to: string): Promise<Reservation[]> {
  const params = new URLSearchParams({ roomId: String(roomId), from, to })
  return apiFetch<Reservation[]>(`/api/rooms/reservations?${params.toString()}`)
}

export function createReservation(input: { roomId: number; title: string; startAt: string; endAt: string }) {
  return apiFetch<Reservation>("/api/rooms/reservations", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteReservation(reservationId: number) {
  return apiFetch<void>(`/api/rooms/reservations/${reservationId}`, { method: "DELETE" })
}
