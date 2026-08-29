import { apiFetch, apiUpload } from "./client"

export interface Folder {
  folderId: number
  parentFolderId: number | null
  name: string
}

export interface FileItem {
  fileId: number
  folderId: number
  fileName: string
  currentPath: string
  updatedBy: number
  updatedByName: string
  updatedAt: string
  permalinkSlug: string
}

export function listFolders(parentFolderId: number | null): Promise<Folder[]> {
  const params = parentFolderId !== null ? `?parentFolderId=${parentFolderId}` : ""
  return apiFetch<Folder[]>(`/api/files/folders${params}`)
}

export function createFolder(name: string, parentFolderId: number | null): Promise<Folder> {
  return apiFetch<Folder>("/api/files/folders", {
    method: "POST",
    body: JSON.stringify({ name, parentFolderId }),
  })
}

export function listFiles(folderId: number): Promise<FileItem[]> {
  return apiFetch<FileItem[]>(`/api/files?folderId=${folderId}`)
}

export function listRecentFiles(limit: number): Promise<FileItem[]> {
  return apiFetch<FileItem[]>(`/api/files?recent=${limit}`)
}

export function getFile(fileId: number): Promise<FileItem> {
  return apiFetch<FileItem>(`/api/files/${fileId}`)
}

export function getFileBySlug(slug: string): Promise<FileItem> {
  return apiFetch<FileItem>(`/api/files/by-slug/${slug}`)
}

export function downloadUrl(fileId: number): string {
  return `/api/files/${fileId}/download`
}

export function uploadFile(folderId: number, file: File): Promise<FileItem> {
  const formData = new FormData()
  formData.append("folderId", String(folderId))
  formData.append("file", file)
  return apiUpload<FileItem>("/api/files/upload", formData)
}

export function uploadNewVersion(fileId: number, file: File): Promise<FileItem> {
  const formData = new FormData()
  formData.append("file", file)
  return apiUpload<FileItem>(`/api/files/${fileId}/versions`, formData)
}

export function deleteFile(fileId: number): Promise<void> {
  return apiFetch<void>(`/api/files/${fileId}`, { method: "DELETE" })
}
