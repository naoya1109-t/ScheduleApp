import { useRef, useState, type DragEvent } from "react"

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16.5v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
      <path d="M12 3v13" />
      <path d="M7 8l5-5 5 5" />
    </svg>
  )
}

export function FileDropZone({
  onFilesSelected,
  multiple = false,
  label = "ここにファイルをドラッグ&ドロップ、またはクリックして選択",
}: {
  onFilesSelected: (files: File[]) => void
  multiple?: boolean
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    onFilesSelected(Array.from(fileList))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
        isDragging ? "border-indigo bg-indigo-soft" : "border-border bg-surface-alt hover:border-indigo"
      }`}
    >
      <span className={isDragging ? "text-indigo" : "text-text-soft"}>
        <UploadIcon />
      </span>
      <span className="text-[12.5px] font-semibold text-text-soft">{label}</span>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
