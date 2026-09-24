import { create } from 'zustand'
import type { CharacterProfile, PlayerId } from '../types'
import { characterRepository, settingsRepository } from '../storage/repositories'

export type Screen = 'home' | 'create-character' | 'host-room' | 'join-room' | 'session'

interface AppState {
  screen: Screen
  loading: boolean
  characters: CharacterProfile[]
  activeCharacter: CharacterProfile | null
  lastRoomAddress: string

  load: () => Promise<void>
  navigate: (screen: Screen) => void
  saveCharacter: (profile: CharacterProfile) => Promise<void>
  selectCharacter: (id: PlayerId) => Promise<void>
  deleteCharacter: (id: PlayerId) => Promise<void>
  rememberRoomAddress: (address: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'home',
  loading: true,
  characters: [],
  activeCharacter: null,
  lastRoomAddress: '',

  load: async () => {
    const [characters, settings] = await Promise.all([characterRepository.list(), settingsRepository.get()])
    characters.sort((a, b) => b.UpdatedAt.localeCompare(a.UpdatedAt))
    const active = characters.find((c) => c.PlayerId === settings.activeCharacterId) ?? characters[0] ?? null
    set({ characters, activeCharacter: active, lastRoomAddress: settings.lastRoomAddress ?? '', loading: false })
  },

  navigate: (screen) => set({ screen }),

  saveCharacter: async (profile) => {
    const saved = await characterRepository.save(profile)
    await settingsRepository.patch({ activeCharacterId: saved.PlayerId })
    const others = get().characters.filter((c) => c.PlayerId !== saved.PlayerId)
    set({ characters: [saved, ...others], activeCharacter: saved })
  },

  selectCharacter: async (id) => {
    const profile = get().characters.find((c) => c.PlayerId === id) ?? null
    await settingsRepository.patch({ activeCharacterId: id })
    set({ activeCharacter: profile })
  },

  deleteCharacter: async (id) => {
    await characterRepository.remove(id)
    const characters = get().characters.filter((c) => c.PlayerId !== id)
    const active = get().activeCharacter?.PlayerId === id ? (characters[0] ?? null) : get().activeCharacter
    await settingsRepository.patch({ activeCharacterId: active?.PlayerId ?? null })
    set({ characters, activeCharacter: active })
  },

  rememberRoomAddress: async (address) => {
    await settingsRepository.patch({ lastRoomAddress: address })
    set({ lastRoomAddress: address })
  },
}))
