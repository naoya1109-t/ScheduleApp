import { useEffect, useRef } from "react"

const COLORS = ["#262a3d", "#e2725b", "#4f5fad", "#3e8e82"]

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.execCommand("styleWithCSS", false, "true")
  }, [])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function handleInput() {
    onChange(editorRef.current?.innerHTML ?? "")
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-3 py-2">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="rounded px-2 py-1 text-sm font-bold hover:bg-white"
        >
          B
        </button>
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => exec("foreColor", color)}
            className="h-5 w-5 rounded-full border border-border"
            style={{ backgroundColor: color }}
            aria-label={`文字色 ${color}`}
          />
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[160px] px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  )
}
