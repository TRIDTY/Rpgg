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

// ---------------------------------------------------------------------------
// Personagem (documento JSON persistido localmente — o "save game" do jogador)
// ---------------------------------------------------------------------------

export type PlayerId = string
export type PlayerRole = 'Player' | 'GM'

export type AttributeValue = string | number | boolean

export interface CharacterProfile {
  PlayerId: PlayerId
  Name: string
  Role: PlayerRole
  Avatar: string
  Title?: string
  Level: number
  Attributes: Record<string, AttributeValue>
  Inventory: InventorySlot[]
  CreatedAt: string
  UpdatedAt: string
}

// ---------------------------------------------------------------------------
// Sala / sessão local (o Host é a fonte da verdade)
// ---------------------------------------------------------------------------

export interface RoomInfo {
  roomId: string
  name: string
  host: string
  port: number
  password: string
}

export interface GameSession {
  roomId: string
  name: string
  password: string
  hostId: PlayerId
  createdAt: string
  members: Record<PlayerId, SessionMember>
}

export interface SessionMember {
  profile: CharacterProfile
  online: boolean
  joinedAt: string
}

// ---------------------------------------------------------------------------
// Eventos Host -> Cliente
// ---------------------------------------------------------------------------

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

export interface SessionUpdatedEvent {
  type: 'SessionUpdatedEvent'
  roomName: string
  actors: Actor[]
}

export interface JoinAcceptedEvent {
  type: 'JoinAccepted'
  playerId: PlayerId
  roomName: string
  actors: Actor[]
  inventory: InventorySlot[]
}

export interface JoinRejectedEvent {
  type: 'JoinRejected'
  reason: string
}

export interface ItemReceivedEvent {
  type: 'ItemReceivedEvent'
  fromId: ActorId
  item: Item
}

export type ServerEvent =
  | InventoryUpdatedEvent
  | ActorPresenceEvent
  | SessionUpdatedEvent
  | JoinAcceptedEvent
  | JoinRejectedEvent
  | ItemReceivedEvent

// ---------------------------------------------------------------------------
// Comandos Cliente -> Host
// ---------------------------------------------------------------------------

export interface JoinRoomCommand {
  type: 'JoinRoom'
  password: string
  character: CharacterProfile
}

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

export type ClientCommand = JoinRoomCommand | MoveItemCommand | InitiateTradeCommand
