import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

/**
 * Banco de documentos JSON local. Cada documento é um arquivo/entrada JSON
 * identificado por uma coleção e uma chave (ex: characters/<PlayerId>).
 */
export interface DocumentStore {
  read<T>(collection: string, key: string): Promise<T | null>
  write<T>(collection: string, key: string, doc: T): Promise<void>
  remove(collection: string, key: string): Promise<void>
  list<T>(collection: string): Promise<T[]>
}

const PREFIX = 'rpgg'

/** Web / demo em arquivo único: cada documento vira uma entrada do localStorage. */
export class LocalStorageDocumentStore implements DocumentStore {
  private keyOf(collection: string, key: string) {
    return `${PREFIX}/${collection}/${key}`
  }

  async read<T>(collection: string, key: string): Promise<T | null> {
    const raw = localStorage.getItem(this.keyOf(collection, key))
    return raw ? (JSON.parse(raw) as T) : null
  }

  async write<T>(collection: string, key: string, doc: T): Promise<void> {
    localStorage.setItem(this.keyOf(collection, key), JSON.stringify(doc))
  }

  async remove(collection: string, key: string): Promise<void> {
    localStorage.removeItem(this.keyOf(collection, key))
  }

  async list<T>(collection: string): Promise<T[]> {
    const prefix = `${PREFIX}/${collection}/`
    const docs: T[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) {
        const raw = localStorage.getItem(k)
        if (raw) docs.push(JSON.parse(raw) as T)
      }
    }
    return docs
  }
}

/** Nativo (Android/iOS): um arquivo .json por documento no diretório de dados do app. */
export class FilesystemDocumentStore implements DocumentStore {
  private pathOf(collection: string, key: string) {
    return `${PREFIX}/${collection}/${encodeURIComponent(key)}.json`
  }

  private async ensureDir(collection: string) {
    try {
      await Filesystem.mkdir({ path: `${PREFIX}/${collection}`, directory: Directory.Data, recursive: true })
    } catch {
      // já existe
    }
  }

  async read<T>(collection: string, key: string): Promise<T | null> {
    try {
      const res = await Filesystem.readFile({
        path: this.pathOf(collection, key),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      return JSON.parse(res.data as string) as T
    } catch {
      return null
    }
  }

  async write<T>(collection: string, key: string, doc: T): Promise<void> {
    await this.ensureDir(collection)
    await Filesystem.writeFile({
      path: this.pathOf(collection, key),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      data: JSON.stringify(doc, null, 2),
    })
  }

  async remove(collection: string, key: string): Promise<void> {
    try {
      await Filesystem.deleteFile({ path: this.pathOf(collection, key), directory: Directory.Data })
    } catch {
      // não existia
    }
  }

  async list<T>(collection: string): Promise<T[]> {
    await this.ensureDir(collection)
    const dir = await Filesystem.readdir({ path: `${PREFIX}/${collection}`, directory: Directory.Data })
    const docs: T[] = []
    for (const entry of dir.files) {
      if (entry.type !== 'file' || !entry.name.endsWith('.json')) continue
      const res = await Filesystem.readFile({
        path: `${PREFIX}/${collection}/${entry.name}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      docs.push(JSON.parse(res.data as string) as T)
    }
    return docs
  }
}

export const documentStore: DocumentStore = Capacitor.isNativePlatform()
  ? new FilesystemDocumentStore()
  : new LocalStorageDocumentStore()
