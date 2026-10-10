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
export function DiscardItem(slotIndex: number, itemId: ItemId, ownerId?: PlayerId) {
  console.log(`DiscardItem(${slotIndex}, ${itemId}${ownerId ? `, ${ownerId}` : ''})`)
  useRoomStore.getState().sendCommand({ type: 'DiscardItem', slotIndex, itemId, ownerId })
}

/** Mestre retira um item da mochila de um bot para a própria mochila. */
export function TakeItem(ownerId: PlayerId, slotIndex: number, itemId: ItemId) {
  console.log(`TakeItem(${ownerId}, ${slotIndex}, ${itemId})`)
  useRoomStore.getState().sendCommand({ type: 'TakeItem', ownerId, slotIndex, itemId })
}

/** Mestre cria um bot (NPC/baú/mercador) na sala; a mochila dele fica sob controle total do Mestre. */
export function CreateBot(name: string, avatar: string) {
  console.log(`CreateBot(${name})`)
  useRoomStore.getState().sendCommand({ type: 'CreateBot', name, avatar })
}

export function RemoveBot(botId: PlayerId) {
  console.log(`RemoveBot(${botId})`)
  useRoomStore.getState().sendCommand({ type: 'RemoveBot', botId })
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

/** Mestre altera o Nível da ficha de um membro; o Host valida a Role e avisa o aparelho dele para salvar. */
export function SetLevel(targetId: PlayerId, level: number) {
  console.log(`SetLevel(${targetId}, ${level})`)
  useRoomStore.getState().sendCommand({ type: 'SetLevel', targetId, level })
}
