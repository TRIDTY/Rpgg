import type { InventorySlot, Item, ItemId } from '../types'

export interface InventoryChange {
  slots: InventorySlot[]
  /** Índices alterados — só eles viajam no InventoryUpdatedEvent. */
  changed: InventorySlot[]
}

const clone = (slots: InventorySlot[]) => slots.map((s) => ({ ...s }))

/** Move/troca/empilha entre dois slots. Retorna null quando nada muda. */
export function moveItem(slots: InventorySlot[], fromSlot: number, toSlot: number): InventoryChange | null {
  if (fromSlot === toSlot) return null
  const next = clone(slots)
  const source = next[fromSlot]
  const target = next[toSlot]
  if (!source?.item || !target) return null

  if (target.item && target.item.id === source.item.id && target.item.maxStack > 1) {
    const room = target.item.maxStack - target.item.quantity
    const moved = Math.min(room, source.item.quantity)
    if (moved === 0) return null
    target.item = { ...target.item, quantity: target.item.quantity + moved }
    const remaining = source.item.quantity - moved
    source.item = remaining > 0 ? { ...source.item, quantity: remaining } : null
  } else {
    const swapped = target.item
    target.item = source.item
    source.item = swapped
  }
  return { slots: next, changed: [source, target] }
}

/** Adiciona um item empilhando no que já existe ou no primeiro slot vazio. Null se não cabe. */
export function addItem(slots: InventorySlot[], item: Item): InventoryChange | null {
  const next = clone(slots)
  let remaining = item.quantity
  const changed: InventorySlot[] = []

  for (const slot of next) {
    if (remaining === 0) break
    if (slot.item?.id === item.id && slot.item.quantity < slot.item.maxStack) {
      const add = Math.min(slot.item.maxStack - slot.item.quantity, remaining)
      slot.item = { ...slot.item, quantity: slot.item.quantity + add }
      remaining -= add
      changed.push(slot)
    }
  }
  for (const slot of next) {
    if (remaining === 0) break
    if (slot.item === null) {
      const add = Math.min(item.maxStack, remaining)
      slot.item = { ...item, quantity: add }
      remaining -= add
      changed.push(slot)
    }
  }
  if (remaining > 0) return null
  return { slots: next, changed }
}

/** Remove a primeira pilha de um item. Retorna o item removido (com sua quantidade). */
export function takeItem(slots: InventorySlot[], itemId: ItemId): (InventoryChange & { item: Item }) | null {
  const next = clone(slots)
  const slot = next.find((s) => s.item?.id === itemId)
  if (!slot?.item) return null
  const item = slot.item
  slot.item = null
  return { slots: next, changed: [slot], item }
}

export const countUsed = (slots: InventorySlot[]) => slots.filter((s) => s.item !== null).length
