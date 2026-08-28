import { describe, expect, it } from "vitest"
import { sanitizePostBody } from "../src/modules/board/sanitize.js"

describe("sanitizePostBody", () => {
  it("scriptタグを除去する(XSS対策)", () => {
    const result = sanitizePostBody('<p>本文</p><script>alert("xss")</script>')
    expect(result).not.toContain("<script>")
    expect(result).not.toContain("alert")
  })

  it("onerror等のイベントハンドラ属性を除去する", () => {
    const result = sanitizePostBody('<img src="x" onerror="alert(1)">')
    expect(result).not.toContain("onerror")
  })

  it("太字・文字色の装飾は保持する", () => {
    const result = sanitizePostBody('<p><b>太字</b><span style="color:#ff0000">赤字</span></p>')
    expect(result).toContain("<b>太字</b>")
    expect(result).toContain('color:#ff0000')
  })

  it("javascript:スキームのリンクを許可しない(aタグ自体を許可しない)", () => {
    const result = sanitizePostBody('<a href="javascript:alert(1)">click</a>')
    expect(result).not.toContain("<a")
    expect(result).not.toContain("javascript:")
  })
})
