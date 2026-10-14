import { useMemo } from 'react'
import { create } from 'zustand'
import { iconRepository, type CustomIcon, type CustomIconKind } from '../storage/repositories'

interface IconState {
  icons: CustomIcon[]
  loaded: boolean
  /** Imagem bruta (data URL) escolhida da câmera/galeria, aguardando recorte. */
  draft: string | null

  load: () => Promise<void>
  setDraft: (dataUrl: string | null) => void
  add: (kind: CustomIconKind, dataUrl: string) => Promise<CustomIcon>
  remove: (id: string) => Promise<void>
}

export const useIconStore = create<IconState>((set, get) => ({
  icons: [],
  loaded: false,
  draft: null,

  load: async () => {
    const icons = await iconRepository.list()
    icons.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    set({ icons, loaded: true })
  },

  setDraft: (draft) => set({ draft }),

  add: async (kind, dataUrl) => {
    const icon: CustomIcon = { id: crypto.randomUUID(), kind, dataUrl, createdAt: new Date().toISOString() }
    await iconRepository.save(icon)
    set({ icons: [icon, ...get().icons] })
    return icon
  },

  remove: async (id) => {
    await iconRepository.remove(id)
    set({ icons: get().icons.filter((i) => i.id !== id) })
  },
}))

/** Ícones de um tipo, memoizados (um seletor que filtra devolveria um array novo a cada render). */
export function useCustomIcons(kind: CustomIconKind): CustomIcon[] {
  const icons = useIconStore((s) => s.icons)
  return useMemo(() => icons.filter((i) => i.kind === kind), [icons, kind])
}
