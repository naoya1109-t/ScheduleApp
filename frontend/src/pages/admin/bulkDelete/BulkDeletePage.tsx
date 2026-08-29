import { useState } from "react"
import { ApiError } from "../../../api/client"
import { executeBulkDeletePosts, previewBulkDeletePosts } from "../../../api/posts"

export function BulkDeletePage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [resultCount, setResultCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toRangeIso(dateStr: string, endOfDay: boolean): string {
    return new Date(`${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}`).toISOString()
  }

  async function handlePreview() {
    setError(null)
    setResultCount(null)
    try {
      const result = await previewBulkDeletePosts(toRangeIso(from, false), toRangeIso(to, true))
      setPreviewCount(result.count)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "プレビューの取得に失敗しました")
    }
  }

  async function handleExecute() {
    setError(null)
    try {
      const result = await executeBulkDeletePosts(toRangeIso(from, false), toRangeIso(to, true))
      setResultCount(result.count)
      setPreviewCount(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "削除に失敗しました")
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <h1 className="mb-6 text-[18px] font-bold">お知らせ・掲示板の一括削除</h1>
      <p className="mb-6 text-[12.5px] text-text-soft">
        最終更新日を指定し、対象の投稿・添付ファイルを一括削除します。ゴミ箱機能は無いため、削除後の復元はできません。
      </p>

      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-6">
        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">最終更新日(開始)</label>
            <input
              type="date"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPreviewCount(null)
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-bold text-text-soft">最終更新日(終了)</label>
            <input
              type="date"
              className="rounded-md border border-border px-3 py-2 text-sm"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPreviewCount(null)
              }}
            />
          </div>
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          onClick={handlePreview}
          disabled={!from || !to}
          className="rounded-md border border-border py-2 text-sm font-bold text-text-soft disabled:opacity-50"
        >
          対象件数を確認
        </button>

        {previewCount !== null && (
          <div className="rounded-md border border-coral-soft bg-coral-soft p-4">
            <p className="mb-3 text-sm font-bold text-coral">
              対象件数: {previewCount}件。この操作は取り消せません。よろしいですか?
            </p>
            <button
              onClick={handleExecute}
              disabled={previewCount === 0}
              className="rounded-md bg-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              削除を実行する
            </button>
          </div>
        )}

        {resultCount !== null && <p className="text-sm text-teal">{resultCount}件を削除しました。</p>}
      </div>
    </div>
  )
}
