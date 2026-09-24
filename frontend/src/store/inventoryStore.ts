import { create } from 'zustand'
import type { Actor, ActorId, InventorySlot, InventoryUpdatedEvent, Item, ItemId } from '../types'
import { INVENTORY_CAPACITY } from '../data/mockData'
import { emptyInventory } from '../domain/character'
import { moveItem as moveItemOp } from '../domain/inventory'

export interface Notice {
  id: number
  text: string
}

interface InventoryState {
  selfId: ActorId
  self: Actor | null
  roomName: string
  capacity: number
  slots: InventorySlot[]
  actors: Actor[]
  connected: boolean
  notices: Notice[]

  hydrate: (input: { selfId: ActorId; roomName: string; slots: InventorySlot[]; actors: Actor[] }) => void
  moveItem: (fromSlot: number, toSlot: number) => void
  applyInventoryUpdated: (event: InventoryUpdatedEvent) => void
  setActors: (actors: Actor[]) => void
  setActorOnline: (actorId: ActorId, online: boolean) => void
  setConnected: (connected: boolean) => void
  pushNotice: (text: string) => void
  dismissNotice: (id: number) => void
  reset: () => void
}

let noticeSeq = 0

export const useInventoryStore = create<InventoryState>((set) => ({
  selfId: '',
  self: null,
  roomName: '',
  capacity: INVENTORY_CAPACITY,
  slots: emptyInventory(),
  actors: [],
  connected: false,
  notices: [],

  hydrate: ({ selfId, roomName, slots, actors }) =>
    set({
      selfId,
      self: actors.find((a) => a.id === selfId) ?? null,
      roomName,
      slots,
      capacity: slots.length,
      actors: actors.filter((a) => a.id !== selfId),
    }),

  moveItem: (fromSlot, toSlot) =>
    set((state) => {
      const change = moveItemOp(state.slots, fromSlot, toSlot)
      return change ? { slots: change.slots } : state
    }),

  applyInventoryUpdated: (event) =>
    set((state) => {
      if (event.ownerId !== state.selfId) return state
      const slots = state.slots.map((s) => ({ ...s }))
      for (const incoming of event.slots) {
        if (incoming.index >= 0 && incoming.index < slots.length) {
          slots[incoming.index] = { index: incoming.index, item: incoming.item }
        }
      }
      return { slots }
    }),

  setActors: (actors) => set((state) => ({ actors: actors.filter((a) => a.id !== state.selfId) })),

  setActorOnline: (actorId, online) =>
    set((state) => ({
      actors: state.actors.map((a) => (a.id === actorId ? { ...a, online } : a)),
    })),

  setConnected: (connected) => set({ connected }),

  pushNotice: (text) => {
    const id = ++noticeSeq
    set((state) => ({ notices: [...state.notices, { id, text }] }))
    setTimeout(() => useInventoryStore.getState().dismissNotice(id), 4000)
  },

  dismissNotice: (id) => set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),

  reset: () =>
    set({ selfId: '', self: null, roomName: '', slots: emptyInventory(), actors: [], connected: false, notices: [] }),
}))

export const selectItemById = (itemId: ItemId) => (state: InventoryState): Item | undefined =>
  state.slots.find((s) => s.item?.id === itemId)?.item ?? undefined

export const selectActorById = (actorId: ActorId) => (state: InventoryState): Actor | undefined =>
  state.actors.find((a) => a.id === actorId)
