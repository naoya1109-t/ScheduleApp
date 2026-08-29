import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ApiError } from "../../api/client"
import {
  createFolder,
  deleteFile,
  downloadUrl,
  listFiles,
  listFolders,
  uploadFile,
  uploadNewVersion,
  type FileItem,
  type Folder,
} from "../../api/files"
import { FileDropZone } from "../../components/FileDropZone"

export function FilesPage() {
  const [path, setPath] = useState<Folder[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const versionInputRefs = useRef(new Map<number, HTMLInputElement>())

  const currentFolderId = path.length > 0 ? path[path.length - 1].folderId : null

  async function reload() {
    const [folderData, fileData] = await Promise.all([
      listFolders(currentFolderId),
      currentFolderId !== null ? listFiles(currentFolderId) : Promise.resolve([]),
    ])
    setFolders(folderData)
    setFiles(fileData)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listFolders(currentFolderId),
      currentFolderId !== null ? listFiles(currentFolderId) : Promise.resolve([]),
    ]).then(([folderData, fileData]) => {
      if (cancelled) return
      setFolders(folderData)
      setFiles(fileData)
    })
    return () => {
      cancelled = true
    }
  }, [currentFolderId])

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName, currentFolderId)
    setNewFolderName("")
    await reload()
  }

  async function handleUpload(fileList: File[]) {
    const file = fileList[0]
    if (!file || currentFolderId === null) return
    setError(null)
    try {
      await uploadFile(currentFolderId, file)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "アップロードに失敗しました")
    }
  }

  async function handleUploadVersion(fileId: number) {
    const input = versionInputRefs.current.get(fileId)
    const file = input?.files?.[0]
    if (!file) return
    await uploadNewVersion(fileId, file)
    if (input) input.value = ""
    await reload()
  }

  async function handleDelete(fileId: number) {
    await deleteFile(fileId)
    await reload()
  }

  return (
    <div className="mx-auto max-w-[900px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">ファイル共有</h1>
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-[12.5px] text-text-soft">
        <button onClick={() => setPath([])} className="font-bold text-indigo">
          ルート
        </button>
        {path.map((folder, index) => (
          <span key={folder.folderId} className="flex items-center gap-1.5">
            /
            <button onClick={() => setPath(path.slice(0, index + 1))} className="font-bold text-indigo">
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input
          className="rounded-md border border-border px-3 py-1.5 text-sm"
          placeholder="新規フォルダ名"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <button
          onClick={handleCreateFolder}
          className="rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-text-soft"
        >
          フォルダ作成
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {folders.map((folder) => (
          <button
            key={folder.folderId}
            onClick={() => setPath([...path, folder])}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-left text-sm font-bold"
          >
            📁 {folder.name}
          </button>
        ))}
      </div>

      {currentFolderId !== null && (
        <>
          <div className="mb-6 rounded-[14px] border border-border bg-surface p-4">
            <FileDropZone
              onFilesSelected={handleUpload}
              label="ここにファイルをドラッグ&ドロップ、またはクリックして新規登録"
            />
          </div>
          {error && <p className="mb-4 text-sm text-coral">{error}</p>}

          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={file.fileId}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-sm"
              >
                <div>
                  <Link to={`/files/${file.fileId}`} className="font-bold text-indigo">
                    {file.fileName}
                  </Link>
                  <div className="text-[11.5px] text-text-soft">
                    更新者: {file.updatedByName} ・ {new Date(file.updatedAt).toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={downloadUrl(file.fileId)} className="text-indigo">
                    ダウンロード
                  </a>
                  <input
                    type="file"
                    className="w-32 text-[11px]"
                    ref={(el) => {
                      if (el) versionInputRefs.current.set(file.fileId, el)
                    }}
                    onChange={() => handleUploadVersion(file.fileId)}
                  />
                  <button onClick={() => handleDelete(file.fileId)} className="text-coral">
                    削除
                  </button>
                </div>
              </div>
            ))}
            {files.length === 0 && <p className="text-text-soft">ファイルはまだありません。</p>}
          </div>
        </>
      )}

      {currentFolderId === null && (
        <p className="text-text-soft">フォルダを選択するとファイルの一覧・アップロードができます。</p>
      )}
    </div>
  )
}
