import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../../api/client"
import { createRoom, deleteRoom, listRooms, updateRoom, updateRoomOrder, type MeetingRoom } from "../../../api/rooms"

const emptyNewRoom = { name: "", memo: "" }

export function RoomsAdminPage() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [newRoom, setNewRoom] = useState(emptyNewRoom)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyNewRoom)
  const [error, setError] = useState<string | null>(null)
  const [orderSaved, setOrderSaved] = useState(false)

  async function reload() {
    setRooms(await listRooms())
  }

  useEffect(() => {
    let cancelled = false
    listRooms().then((data) => {
      if (!cancelled) setRooms(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createRoom({ name: newRoom.name, memo: newRoom.memo || null })
      setNewRoom(emptyNewRoom)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "会議室の登録に失敗しました")
    }
  }

  function startEdit(room: MeetingRoom) {
    setEditingRoomId(room.roomId)
    setEditForm({ name: room.name, memo: room.memo ?? "" })
  }

  async function handleUpdate(event: FormEvent, roomId: number) {
    event.preventDefault()
    setError(null)
    try {
      await updateRoom(roomId, { name: editForm.name, memo: editForm.memo || null })
      setEditingRoomId(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "会議室の更新に失敗しました")
    }
  }

  async function handleDelete(roomId: number) {
    setError(null)
    try {
      await deleteRoom(roomId)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "会議室の削除に失敗しました")
    }
  }

  function moveRoom(index: number, direction: -1 | 1) {
    setRooms((prev) => {
      const next = [...prev]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  async function handleSaveOrder() {
    setError(null)
    try {
      const orders = rooms.map((room, index) => ({ roomId: room.roomId, displayOrder: index + 1 }))
      const updated = await updateRoomOrder(orders)
      setRooms(updated)
      setOrderSaved(true)
      setTimeout(() => setOrderSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "並び順の保存に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[700px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">会議室管理</h1>

      <form
        onSubmit={handleCreate}
        className="mb-6 flex items-end gap-3 rounded-[14px] border border-border bg-surface p-6"
      >
        <div className="flex-1">
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">会議室名</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            required
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">メモ</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={newRoom.memo}
            onChange={(e) => setNewRoom({ ...newRoom, memo: e.target.value })}
            placeholder="定員・設備など"
          />
        </div>
        <button type="submit" className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          追加
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      <div className="mb-4 flex flex-col gap-2">
        {rooms.map((room, index) =>
          editingRoomId === room.roomId ? (
            <form
              key={room.roomId}
              onSubmit={(e) => handleUpdate(e, room.roomId)}
              className="flex items-end gap-3 rounded-md border border-indigo bg-surface px-4 py-3"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-bold text-text-soft">会議室名</label>
                <input
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-bold text-text-soft">メモ</label>
                <input
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                />
              </div>
              <button type="submit" className="rounded-md bg-indigo px-3 py-1.5 text-[12px] font-bold text-white">
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditingRoomId(null)}
                className="rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
              >
                キャンセル
              </button>
            </form>
          ) : (
            <div
              key={room.roomId}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
            >
              <div>
                <span className="font-bold">
                  {index + 1}. {room.name}
                </span>
                {room.memo && <span className="ml-3 text-text-soft">{room.memo}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveRoom(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveRoom(index, 1)}
                  disabled={index === rooms.length - 1}
                  className="rounded-md border border-border px-2 py-1 text-[12px] disabled:opacity-40"
                >
                  ↓
                </button>
                <button onClick={() => startEdit(room)} className="ml-2 text-indigo">
                  編集
                </button>
                <button onClick={() => handleDelete(room.roomId)} className="text-coral">
                  削除
                </button>
              </div>
            </div>
          ),
        )}
        {rooms.length === 0 && <p className="text-text-soft">会議室はまだ登録されていません。</p>}
      </div>

      {rooms.length > 0 && (
        <button onClick={handleSaveOrder} className="rounded-md bg-indigo px-4 py-2 text-sm font-bold text-white">
          {orderSaved ? "保存しました" : "この順序で保存"}
        </button>
      )}
    </div>
  )
}
