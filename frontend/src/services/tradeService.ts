import type { ActorId, ItemId } from '../types'
import { realtimeClient } from './websocket'

/**
 * Ponto de integração com a API: chamado quando um item é solto sobre a bolinha de um ator
 * e o usuário confirma no modal. Por enquanto apenas loga e envia o comando pelo canal realtime.
 */
export function InitiateTrade(itemId: ItemId, targetPlayerId: ActorId) {
  console.log(`InitiateTrade(${itemId}, ${targetPlayerId})`)
  realtimeClient.send({ type: 'InitiateTrade', itemId, targetPlayerId })
}

export function MoveItem(fromSlot: number, toSlot: number) {
  console.log(`MoveItem(${fromSlot}, ${toSlot})`)
  realtimeClient.send({ type: 'MoveItem', fromSlot, toSlot })
}
