import sanitizeHtml from "sanitize-html"

// 掲示板本文の装飾要件(太字・文字色)に必要な最小限のタグ・属性のみ許可する(要件3-5)
export function sanitizePostBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["b", "strong", "i", "em", "u", "span", "p", "br", "ul", "ol", "li"],
    allowedAttributes: {
      span: ["style"],
    },
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,6}$/],
        "font-weight": [/^bold$/],
      },
    },
  })
}
