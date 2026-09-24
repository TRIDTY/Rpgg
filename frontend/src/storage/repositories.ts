import type { CharacterProfile, GameSession, InventorySlot, PlayerId } from '../types'
import { documentStore, type DocumentStore } from './documentStore'

const CHARACTERS = 'characters'
const SESSIONS = 'sessions'
const SETTINGS = 'settings'

interface AppSettings {
  activeCharacterId: PlayerId | null
  lastRoomAddress?: string
}

export class CharacterRepository {
  private readonly store: DocumentStore

  constructor(store: DocumentStore) {
    this.store = store
  }

  list() {
    return this.store.list<CharacterProfile>(CHARACTERS)
  }

  get(id: PlayerId) {
    return this.store.read<CharacterProfile>(CHARACTERS, id)
  }

  async save(profile: CharacterProfile) {
    const doc = { ...profile, UpdatedAt: new Date().toISOString() }
    await this.store.write(CHARACTERS, doc.PlayerId, doc)
    return doc
  }

  async updateInventory(id: PlayerId, inventory: InventorySlot[]) {
    const current = await this.get(id)
    if (!current) return null
    return this.save({ ...current, Inventory: inventory })
  }

  remove(id: PlayerId) {
    return this.store.remove(CHARACTERS, id)
  }
}

export class SessionRepository {
  private readonly store: DocumentStore

  constructor(store: DocumentStore) {
    this.store = store
  }

  list() {
    return this.store.list<GameSession>(SESSIONS)
  }

  get(roomId: string) {
    return this.store.read<GameSession>(SESSIONS, roomId)
  }

  save(session: GameSession) {
    return this.store.write(SESSIONS, session.roomId, session)
  }
}

export class SettingsRepository {
  private readonly store: DocumentStore

  constructor(store: DocumentStore) {
    this.store = store
  }

  async get(): Promise<AppSettings> {
    return (await this.store.read<AppSettings>(SETTINGS, 'app')) ?? { activeCharacterId: null }
  }

  async patch(partial: Partial<AppSettings>) {
    const next = { ...(await this.get()), ...partial }
    await this.store.write(SETTINGS, 'app', next)
    return next
  }
}

export const characterRepository = new CharacterRepository(documentStore)
export const sessionRepository = new SessionRepository(documentStore)
export const settingsRepository = new SettingsRepository(documentStore)
