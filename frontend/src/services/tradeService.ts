import type { ActorId, ItemId } from '../types'
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
