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

export type ActorRole = 'player' | 'master' | 'merchant' | 'bot'

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
/** `Bot`: personagem sem aparelho, criado pelo Mestre dentro da sala e controlado por ele. */
export type PlayerRole = 'Player' | 'GM' | 'Bot'

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
  /** Perfil com que o aparelho Host entrou na própria sala (null enquanto só a rede está aberta). */
  hostId: PlayerId | null
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
  /** Só para Mestres: mochilas dos demais membros, para inspecionar/forjar. */
  inventories?: Record<PlayerId, InventorySlot[]>
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

/** O Mestre alterou o Nível da ficha de um membro; o aparelho dele persiste no save game. */
export interface LevelChangedEvent {
  type: 'LevelChangedEvent'
  playerId: PlayerId
  level: number
  byId: PlayerId
}

export type ServerEvent =
  | InventoryUpdatedEvent
  | ActorPresenceEvent
  | SessionUpdatedEvent
  | JoinAcceptedEvent
  | JoinRejectedEvent
  | ItemReceivedEvent
  | LevelChangedEvent

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

/** Mestre forja um item "on-the-fly" em um slot vazio (próprio ou de um jogador). */
export interface CreateItemCommand {
  type: 'CreateItem'
  ownerId: PlayerId
  slotIndex: number
  item: NewItemInput
}

export interface NewItemInput {
  name: string
  icon: string
  description?: string
  rarity: ItemRarity
  quantity: number
  maxStack: number
}

/** Jogador solta um item na lixeira: o Host destrói a pilha inteira daquele slot. */
export interface DiscardItemCommand {
  type: 'DiscardItem'
  /** Mochila alvo; omitido = a própria. O Mestre pode indicar um bot. */
  ownerId?: PlayerId
  slotIndex: number
  itemId: ItemId
}

/** Mestre entrega um item pronto (ex.: loot do catálogo) a um membro. */
/** Mestre define o Nível de qualquer personagem conectado à sala. */
export interface SetLevelCommand {
  type: 'SetLevel'
  targetId: PlayerId
  level: number
}

export interface TakeItemCommand {
  type: 'TakeItem'
  ownerId: PlayerId
  slotIndex: number
  itemId: ItemId
}

export interface CreateBotCommand {
  type: 'CreateBot'
  name: string
  avatar: string
}

export interface RemoveBotCommand {
  type: 'RemoveBot'
  botId: PlayerId
}

export const MIN_LEVEL = 1
export const MAX_LEVEL = 99

export type ClientCommand =
  | JoinRoomCommand
  | MoveItemCommand
  | InitiateTradeCommand
  | CreateItemCommand
  | DiscardItemCommand
  | TakeItemCommand
  | CreateBotCommand
  | RemoveBotCommand
  | SetLevelCommand
