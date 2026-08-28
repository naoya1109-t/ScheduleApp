import { Parser } from "htmlparser2"

// 一覧・トップ画面での抜粋表示用に、装飾タグを壊さずに本文を切り詰める(要件3-5)
export function excerptHtml(html: string, maxTextLength: number): string {
  let textLength = 0
  let output = ""
  let truncated = false
  const openTags: string[] = []

  const parser = new Parser({
    onopentag(name, attribs) {
      if (truncated) return
      const attrString = Object.entries(attribs)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join("")
      output += `<${name}${attrString}>`
      openTags.push(name)
    },
    ontext(text) {
      if (truncated) return
      const remaining = maxTextLength - textLength
      if (text.length <= remaining) {
        output += text
        textLength += text.length
      } else {
        output += text.slice(0, remaining)
        textLength = maxTextLength
        truncated = true
      }
    },
    onclosetag(name) {
      if (truncated) return
      output += `</${name}>`
      openTags.pop()
    },
  })

  parser.write(html)
  parser.end()

  if (truncated) {
    output += "…"
    for (let i = openTags.length - 1; i >= 0; i--) {
      output += `</${openTags[i]}>`
    }
  }

  return output
}
