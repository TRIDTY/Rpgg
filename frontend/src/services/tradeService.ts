import type { ActorId, ItemId, NewItemInput, PlayerId } from '../types'
import { useRoomStore } from '../store/roomStore'

/**
 * Ponto de integração: chamado quando um item é solto sobre a bolinha de um ator
 * e o usuário confirma no modal. O comando vai para o Host (fonte da verdade),
 * que move o item entre os inventários e devolve InventoryUpdatedEvent.
 */
export function InitiateTrade(itemId: ItemId, targetPlayerId: ActorId) {
  console.log(`InitiateTrade(${itemId}, ${targetPlayerId})`)
  useRoomStore.getState().sendCommand({ type: 'InitiateTrade', itemId, targetPlayerId })
}

export function MoveItem(fromSlot: number, toSlot: number) {
  console.log(`MoveItem(${fromSlot}, ${toSlot})`)
  useRoomStore.getState().sendCommand({ type: 'MoveItem', fromSlot, toSlot })
}

/** Item solto na lixeira: o Host destrói a pilha daquele slot e confirma com InventoryUpdatedEvent. */
export function DiscardItem(slotIndex: number, itemId: ItemId) {
  console.log(`DiscardItem(${slotIndex}, ${itemId})`)
  useRoomStore.getState().sendCommand({ type: 'DiscardItem', slotIndex, itemId })
}

/**
 * Mestre forja um item no slot vazio indicado. O Host gera o UUID, insere no
 * inventário do dono (próprio ou de um jogador) e emite InventoryUpdatedEvent
 * para o aparelho dele, que persiste o JSON local.
 */
export function CreateItem(ownerId: PlayerId, slotIndex: number, item: NewItemInput) {
  console.log(`CreateItem(${ownerId}, ${slotIndex}, ${item.name})`)
  useRoomStore.getState().sendCommand({ type: 'CreateItem', ownerId, slotIndex, item })
}
