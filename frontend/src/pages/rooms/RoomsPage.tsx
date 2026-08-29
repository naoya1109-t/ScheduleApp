import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../api/client"
import {
  createReservation,
  deleteReservation,
  listReservations,
  listRooms,
  type MeetingRoom,
  type Reservation,
} from "../../api/rooms"
import { useAuth } from "../../context/AuthContext"

function rangeIso(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(from)
  to.setDate(to.getDate() + 14)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function RoomsPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [roomId, setRoomId] = useState<number | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [form, setForm] = useState({ title: "", startAt: "", endAt: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listRooms().then((data) => {
      if (cancelled) return
      setRooms(data)
      if (data.length > 0) setRoomId(data[0].roomId)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function reload(targetRoomId: number) {
    const { from, to } = rangeIso()
    setReservations(await listReservations(targetRoomId, from, to))
  }

  useEffect(() => {
    if (roomId === null) return
    let cancelled = false
    const { from, to } = rangeIso()
    listReservations(roomId, from, to).then((data) => {
      if (!cancelled) setReservations(data)
    })
    return () => {
      cancelled = true
    }
  }, [roomId])

  async function handleCreateReservation(event: FormEvent) {
    event.preventDefault()
    if (roomId === null) return
    setError(null)
    try {
      await createReservation({
        roomId,
        title: form.title,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      })
      setForm({ title: "", startAt: "", endAt: "" })
      await reload(roomId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "予約に失敗しました")
    }
  }

  async function handleDelete(reservationId: number) {
    await deleteReservation(reservationId)
    if (roomId !== null) await reload(roomId)
  }

  return (
    <div className="mx-auto max-w-[800px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">会議室予約</h1>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-[11.5px] font-bold text-text-soft">会議室</label>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={roomId ?? ""}
          onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : null)}
        >
          {rooms.map((room) => (
            <option key={room.roomId} value={room.roomId}>
              {room.name}
              {room.capacity ? `(定員${room.capacity}名)` : ""}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleCreateReservation}
        className="mb-8 flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">タイトル</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">開始</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">終了</label>
            <input
              type="datetime-local"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button type="submit" className="rounded-md bg-indigo py-2 text-sm font-bold text-white">
          予約する
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {reservations.map((reservation) => (
          <div
            key={reservation.reservationId}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
          >
            <div>
              <span className="font-bold">{reservation.title}</span>
              <span className="ml-3 text-text-soft">
                {new Date(reservation.startAt).toLocaleString("ja-JP")} 〜{" "}
                {new Date(reservation.endAt).toLocaleString("ja-JP")}
              </span>
              <span className="ml-3 text-text-soft">予約者: {reservation.reserverName}</span>
            </div>
            {(reservation.reserverId === user?.userId || user?.role === "admin") && (
              <button onClick={() => handleDelete(reservation.reservationId)} className="text-coral">
                取消
              </button>
            )}
          </div>
        ))}
        {reservations.length === 0 && <p className="text-text-soft">予約はまだありません。</p>}
      </div>
    </div>
  )
}
