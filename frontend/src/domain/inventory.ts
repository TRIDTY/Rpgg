import type { InventorySlot, Item, ItemId, ItemLocation } from '../types'

export interface InventoryChange {
  slots: InventorySlot[]
  /** Índices alterados — só eles viajam no InventoryUpdatedEvent. */
  changed: InventorySlot[]
}

const clone = (slots: InventorySlot[]) => slots.map((s) => ({ ...s }))

const descriptionOf = (item: Item) => (item.description ?? '').trim()

/**
 * Dois itens são a "mesma coisa" (e podem virar uma pilha) quando têm exatamente
 * o mesmo nome e a mesma descrição e ambos são empilháveis.
 */
export function canStack(a: Item, b: Item) {
  return (
    !a.container &&
    !b.container &&
    a.name === b.name &&
    descriptionOf(a) === descriptionOf(b) &&
    a.image === b.image &&
    a.maxStack > 1 &&
    b.maxStack > 1
  )
}

export const isContainer = (item: Item) => item.container !== undefined

/** Slot real (da mochila ou interno) apontado por `loc`, clonando o container para não mutar o estado anterior. */
function resolve(next: InventorySlot[], loc: ItemLocation): InventorySlot | null {
  const bag = next[loc.slot]
  if (!bag) return null
  if (loc.inner === undefined) return bag
  if (!bag.item?.container) return null
  const container = clone(bag.item.container)
  bag.item = { ...bag.item, container }
  return container[loc.inner] ?? null
}

const sameLocation = (a: ItemLocation, b: ItemLocation) => a.slot === b.slot && a.inner === b.inner

/**
 * Move entre quaisquer posições (mochila ↔ dentro de itens de armazenamento) com as
 * mesmas regras de fusão/troca de `moveItem`. Itens de armazenamento nunca entram em
 * outro item de armazenamento (nem em si mesmos).
 */
export function moveItemAt(slots: InventorySlot[], from: ItemLocation, to: ItemLocation): InventoryChange | null {
  if (from.inner === undefined && to.inner === undefined) return moveItem(slots, from.slot, to.slot)
  if (sameLocation(from, to)) return null
  const next = clone(slots)
  const source = resolve(next, from)
  const target = resolve(next, to)
  if (!source?.item || !target) return null
  if (to.inner !== undefined && (isContainer(source.item) || from.slot === to.slot && from.inner === undefined)) return null
  if (from.inner !== undefined && target.item && isContainer(target.item)) return null

  const room = target.item && canStack(source.item, target.item) ? target.item.maxStack - target.item.quantity : 0
  if (target.item && room > 0) {
    const moved = Math.min(room, source.item.quantity)
    target.item = { ...target.item, quantity: target.item.quantity + moved }
    const remaining = source.item.quantity - moved
    source.item = remaining > 0 ? { ...source.item, quantity: remaining } : null
  } else {
    const swapped = target.item
    target.item = source.item
    source.item = swapped
  }
  const changed = from.slot === to.slot ? [next[from.slot]] : [next[from.slot], next[to.slot]]
  return { slots: next, changed }
}

/** `removeItem` para qualquer posição (inclusive dentro de um item de armazenamento). */
export function removeItemAt(
  slots: InventorySlot[],
  loc: ItemLocation,
  itemId?: ItemId,
): (InventoryChange & { item: Item }) | null {
  if (loc.inner === undefined) return removeItem(slots, loc.slot, itemId)
  const next = clone(slots)
  const slot = resolve(next, loc)
  if (!slot?.item) return null
  if (itemId && slot.item.id !== itemId) return null
  const item = slot.item
  slot.item = null
  return { slots: next, changed: [next[loc.slot]], item }
}

/** Redimensiona a mochila; null se algum slot a remover ainda tem item. */
export function resizeInventory(slots: InventorySlot[], size: number): InventorySlot[] | null {
  if (slots.slice(size).some((s) => s.item !== null)) return null
  return Array.from({ length: size }, (_, index) => ({ index, item: slots[index]?.item ?? null }))
}

export const itemAt = (slots: InventorySlot[], loc: ItemLocation): Item | null => {
  const bag = slots[loc.slot]?.item ?? null
  if (loc.inner === undefined) return bag
  return bag?.container?.[loc.inner]?.item ?? null
}

/**
 * Move um item entre dois slots. Se o destino tiver um item igual (nome + descrição)
 * e ainda houver espaço na pilha, funde as quantidades e esvazia a origem (ou deixa
 * o excedente nela). Caso contrário troca os dois de lugar. Retorna null quando nada muda.
 */
export function moveItem(slots: InventorySlot[], fromSlot: number, toSlot: number): InventoryChange | null {
  if (fromSlot === toSlot) return null
  const next = clone(slots)
  const source = next[fromSlot]
  const target = next[toSlot]
  if (!source?.item || !target) return null

  const room = target.item && canStack(source.item, target.item) ? target.item.maxStack - target.item.quantity : 0
  if (target.item && room > 0) {
    const moved = Math.min(room, source.item.quantity)
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

/** Destrói a pilha de um slot (lixeira). `itemId` protege contra descartar um item que já mudou de lugar. */
export function removeItem(
  slots: InventorySlot[],
  slotIndex: number,
  itemId?: ItemId,
): (InventoryChange & { item: Item }) | null {
  const next = clone(slots)
  const slot = next[slotIndex]
  if (!slot?.item) return null
  if (itemId && slot.item.id !== itemId) return null
  const item = slot.item
  slot.item = null
  return { slots: next, changed: [slot], item }
}

/** Adiciona um item empilhando no que já existe ou no primeiro slot vazio. Null se não cabe. */
export function addItem(slots: InventorySlot[], item: Item): InventoryChange | null {
  const next = clone(slots)
  let remaining = item.quantity
  const changed: InventorySlot[] = []

  for (const slot of next) {
    if (remaining === 0) break
    if (slot.item && canStack(slot.item, item) && slot.item.quantity < slot.item.maxStack) {
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

/** Marca/desmarca o item de um slot como equipado. Null se o slot não tem esse item ou nada muda. */
export function setEquipped(
  slots: InventorySlot[],
  slotIndex: number,
  itemId: ItemId,
  equipped: boolean,
): (InventoryChange & { item: Item }) | null {
  const next = clone(slots)
  const slot = next[slotIndex]
  if (!slot?.item || slot.item.id !== itemId) return null
  if (Boolean(slot.item.equipped) === equipped) return null
  slot.item = equipped ? { ...slot.item, equipped: true } : { ...slot.item, equipped: undefined }
  return { slots: next, changed: [slot], item: slot.item }
}

/** Cópia do item para outra mochila: o status "equipado" não viaja junto. */
export const unequipped = (item: Item): Item => (item.equipped ? { ...item, equipped: undefined } : item)

/** Coloca um item em um slot específico, apenas se ele estiver vazio. */
export function placeItem(slots: InventorySlot[], slotIndex: number, item: Item): InventoryChange | null {
  const next = clone(slots)
  const slot = next[slotIndex]
  if (!slot || slot.item !== null) return null
  slot.item = item
  return { slots: next, changed: [slot] }
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
