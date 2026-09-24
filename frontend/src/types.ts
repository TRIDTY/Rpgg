export type ItemId = string
export type ActorId = string

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Item {
  id: ItemId
  name: string
  icon: string
  quantity: number
  maxStack: number
  rarity: ItemRarity
  description?: string
}

export interface InventorySlot {
  index: number
  item: Item | null
}

export interface Inventory {
  ownerId: ActorId
  capacity: number
  slots: InventorySlot[]
}

export type ActorRole = 'player' | 'master' | 'merchant'

export interface Actor {
  id: ActorId
  name: string
  role: ActorRole
  avatar: string
  online: boolean
  level?: number
  title?: string
  equipped: Item[]
}

export interface InventoryUpdatedEvent {
  type: 'InventoryUpdatedEvent'
  ownerId: ActorId
  slots: InventorySlot[]
}

export interface ActorPresenceEvent {
  type: 'ActorPresenceEvent'
  actorId: ActorId
  online: boolean
}

export type ServerEvent = InventoryUpdatedEvent | ActorPresenceEvent

export interface MoveItemCommand {
  type: 'MoveItem'
  fromSlot: number
  toSlot: number
}

export interface InitiateTradeCommand {
  type: 'InitiateTrade'
  itemId: ItemId
  targetPlayerId: ActorId
}

export type ClientCommand = MoveItemCommand | InitiateTradeCommand
