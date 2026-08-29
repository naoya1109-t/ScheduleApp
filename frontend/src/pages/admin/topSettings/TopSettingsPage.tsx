import { useEffect, useState, type FormEvent } from "react"
import { ApiError } from "../../../api/client"
import { getTopPageSettings, updateTopPageSettings } from "../../../api/topPage"

export function TopSettingsPage() {
  const [boardDisplayCount, setBoardDisplayCount] = useState(5)
  const [fileDisplayCount, setFileDisplayCount] = useState(5)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getTopPageSettings().then((settings) => {
      if (cancelled) return
      setBoardDisplayCount(settings.boardDisplayCount)
      setFileDisplayCount(settings.fileDisplayCount)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await updateTopPageSettings({ boardDisplayCount, fileDisplayCount })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[500px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">トップ画面 表示件数設定</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">掲示板の表示件数</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={boardDisplayCount}
            onChange={(e) => setBoardDisplayCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-text-soft">ファイル共有の表示件数</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            value={fileDisplayCount}
            onChange={(e) => setFileDisplayCount(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button type="submit" className="rounded-md bg-indigo py-2 text-sm font-bold text-white">
          {saved ? "保存しました" : "保存する"}
        </button>
      </form>
    </div>
  )
}
