import { create } from 'zustand'
import type { Actor, ActorId, InventorySlot, InventoryUpdatedEvent, Item, ItemId } from '../types'
import { buildInitialSlots, INITIAL_ACTORS, INVENTORY_CAPACITY, SELF_ID } from '../data/mockData'

interface InventoryState {
  selfId: ActorId
  capacity: number
  slots: InventorySlot[]
  actors: Actor[]
  connected: boolean

  moveItem: (fromSlot: number, toSlot: number) => void
  applyInventoryUpdated: (event: InventoryUpdatedEvent) => void
  setActorOnline: (actorId: ActorId, online: boolean) => void
  setConnected: (connected: boolean) => void
}

export const useInventoryStore = create<InventoryState>((set) => ({
  selfId: SELF_ID,
  capacity: INVENTORY_CAPACITY,
  slots: buildInitialSlots(),
  actors: INITIAL_ACTORS,
  connected: false,

  moveItem: (fromSlot, toSlot) =>
    set((state) => {
      if (fromSlot === toSlot) return state
      const slots = state.slots.map((s) => ({ ...s }))
      const source = slots[fromSlot]
      const target = slots[toSlot]
      if (!source?.item || !target) return state

      if (target.item && target.item.id === source.item.id && target.item.maxStack > 1) {
        const room = target.item.maxStack - target.item.quantity
        const moved = Math.min(room, source.item.quantity)
        target.item = { ...target.item, quantity: target.item.quantity + moved }
        const remaining = source.item.quantity - moved
        source.item = remaining > 0 ? { ...source.item, quantity: remaining } : null
      } else {
        const swapped = target.item
        target.item = source.item
        source.item = swapped
      }
      return { slots }
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

  setActorOnline: (actorId, online) =>
    set((state) => ({
      actors: state.actors.map((a) => (a.id === actorId ? { ...a, online } : a)),
    })),

  setConnected: (connected) => set({ connected }),
}))

export const selectItemById = (itemId: ItemId) => (state: InventoryState): Item | undefined =>
  state.slots.find((s) => s.item?.id === itemId)?.item ?? undefined

export const selectActorById = (actorId: ActorId) => (state: InventoryState): Actor | undefined =>
  state.actors.find((a) => a.id === actorId)
