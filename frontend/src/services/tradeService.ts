import type { ActorId, ItemId, NewItemInput, PlayerId, ItemLocation } from '../types'
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

export function MoveItem(from: ItemLocation, to: ItemLocation) {
  console.log(`MoveItem(${JSON.stringify(from)} -> ${JSON.stringify(to)})`)
  useRoomStore.getState().sendCommand({ type: 'MoveItem', from, to })
}

/** Item solto na lixeira: o Host destrói a pilha daquele slot e confirma com InventoryUpdatedEvent. */
export function DiscardItem(loc: ItemLocation, itemId: ItemId, ownerId?: PlayerId) {
  console.log(`DiscardItem(${loc.slot}${loc.inner !== undefined ? `/${loc.inner}` : ''}, ${itemId}${ownerId ? `, ${ownerId}` : ''})`)
  useRoomStore.getState().sendCommand({ type: 'DiscardItem', slotIndex: loc.slot, inner: loc.inner, itemId, ownerId })
}

/** Mestre define o nº de slots da mochila de um jogador ou bot. */
export function SetInventorySize(targetId: PlayerId, size: number) {
  console.log(`SetInventorySize(${targetId}, ${size})`)
  useRoomStore.getState().sendCommand({ type: 'SetInventorySize', targetId, size })
}

/** Equipa/desequipa um item da própria mochila (ou, se Mestre, da de um bot); o Host propaga `Actor.equipped` à sala. */
export function SetEquipped(slotIndex: number, itemId: ItemId, equipped: boolean, ownerId?: PlayerId) {
  console.log(`SetEquipped(${slotIndex}, ${itemId}, ${equipped}${ownerId ? `, ${ownerId}` : ''})`)
  useRoomStore.getState().sendCommand({ type: 'SetEquipped', slotIndex, itemId, equipped, ownerId })
}

/** Mestre retira um item da mochila de um bot para a própria mochila. */
export function TakeItem(ownerId: PlayerId, loc: ItemLocation, itemId: ItemId) {
  console.log(`TakeItem(${ownerId}, ${loc.slot}${loc.inner !== undefined ? `/${loc.inner}` : ''}, ${itemId})`)
  useRoomStore.getState().sendCommand({ type: 'TakeItem', ownerId, slotIndex: loc.slot, inner: loc.inner, itemId })
}

/** Mestre cria um bot (NPC/baú/mercador) na sala; a mochila dele fica sob controle total do Mestre. */
export function CreateBot(name: string, avatar: string, hidden = false) {
  console.log(`CreateBot(${name}, hidden=${hidden})`)
  useRoomStore.getState().sendCommand({ type: 'CreateBot', name, avatar, hidden })
}

/** Mestre oculta ou revela um bot para os jogadores; o Host reenvia a lista de atores a cada um. */
export function SetBotHidden(botId: PlayerId, hidden: boolean) {
  console.log(`SetBotHidden(${botId}, ${hidden})`)
  useRoomStore.getState().sendCommand({ type: 'SetBotHidden', botId, hidden })
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
