import { describe, expect, it } from "vitest"
import { excerptHtml } from "../src/modules/board/excerpt.js"

describe("excerptHtml", () => {
  it("上限より短い本文はそのまま返す", () => {
    const result = excerptHtml("<p>短い本文</p>", 100)
    expect(result).toBe("<p>短い本文</p>")
  })

  it("タグを壊さずに切り詰め、開いたタグを閉じる", () => {
    const result = excerptHtml("<p><b>とても長い本文がここに続きます</b></p>", 5)
    expect(result).toBe("<p><b>とても長い…</b></p>")
  })

  it("複数タグが開いた状態でも正しく閉じる", () => {
    const result = excerptHtml("<p><b><span>長い本文テキスト</span></b></p>", 3)
    expect(result).toBe("<p><b><span>長い本…</span></b></p>")
  })
})
