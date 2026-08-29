import type { Folder, FolderRepository } from "../../modules/files/types.js"

export class FakeFolderRepository implements FolderRepository {
  folders: Folder[] = []
  private nextId = 1

  async listChildren(parentFolderId: number | null): Promise<Folder[]> {
    return this.folders.filter((folder) => folder.parentFolderId === parentFolderId)
  }

  async findById(folderId: number): Promise<Folder | undefined> {
    return this.folders.find((folder) => folder.folderId === folderId)
  }

  async create(name: string, parentFolderId: number | null): Promise<Folder> {
    const folder: Folder = { folderId: this.nextId++, name, parentFolderId }
    this.folders.push(folder)
    return folder
  }
}
