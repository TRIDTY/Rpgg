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
  /** Imagem anexada pelo Mestre (data URL); viaja com o item para quem o recebe. */
  image?: string
  /**
   * Item de armazenamento: slots internos (capacidade definida pelo Mestre).
   * Viaja inteiro com o item; itens de armazenamento não entram em outros.
   */
  container?: InventorySlot[]
  /** Item em uso pelo personagem; visível para toda a sala via `Actor.equipped`. */
  equipped?: boolean
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
  /** Nº de slots da mochila (o Mestre pode limitar). */
  slots?: number
  /** Bot oculto pelo Mestre: só chega aos Mestres; jogadores nem o recebem. */
  hidden?: boolean
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
  /** Só para bots: invisível aos jogadores até o Mestre revelar. */
  hidden?: boolean
}

// ---------------------------------------------------------------------------
// Eventos Host -> Cliente
// ---------------------------------------------------------------------------

export interface InventoryUpdatedEvent {
  type: 'InventoryUpdatedEvent'
  ownerId: ActorId
  slots: InventorySlot[]  /** Presente quando a mochila foi redimensionada: `slots` traz a mochila inteira. */
  size?: number
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

/** Posição de um item: slot da mochila e, se dentro de um item de armazenamento, o slot interno. */
export interface ItemLocation {
  slot: number
  inner?: number
}

export interface MoveItemCommand {
  type: 'MoveItem'
  from: ItemLocation
  to: ItemLocation
}

export const MAX_INVENTORY_SLOTS = 100
export const MAX_CONTAINER_SLOTS = 40

/** Mestre limita/amplia a mochila de um jogador ou bot (slots a remover precisam estar vazios). */
export interface SetInventorySizeCommand {
  type: 'SetInventorySize'
  targetId: PlayerId
  size: number
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
  image?: string
  rarity: ItemRarity
  quantity: number
  maxStack: number
  /** Item de armazenamento com este nº de slots internos. */
  containerSlots?: number
}

/** Jogador solta um item na lixeira: o Host destrói a pilha inteira daquele slot. */
export interface DiscardItemCommand {
  type: 'DiscardItem'
  /** Mochila alvo; omitido = a própria. O Mestre pode indicar um bot. */
  ownerId?: PlayerId
  slotIndex: number
  itemId: ItemId
  /** Slot interno, quando o item está dentro de um item de armazenamento. */
  inner?: number
}

/** Mestre entrega um item pronto (ex.: loot do catálogo) a um membro. */
/** Mestre define o Nível de qualquer personagem conectado à sala. */
export interface SetLevelCommand {
  type: 'SetLevel'
  targetId: PlayerId
  level: number
}

/** Jogador equipa/desequipa um item da própria mochila (Mestre também em bots). */
export interface SetEquippedCommand {
  type: 'SetEquipped'
  ownerId?: PlayerId
  slotIndex: number
  itemId: ItemId
  equipped: boolean
}

export interface TakeItemCommand {
  type: 'TakeItem'
  ownerId: PlayerId
  slotIndex: number
  itemId: ItemId
  inner?: number
}

export interface CreateBotCommand {
  type: 'CreateBot'
  name: string
  avatar: string
  hidden?: boolean
}

/** Mestre oculta/revela um bot para os jogadores, a qualquer momento. */
export interface SetBotHiddenCommand {
  type: 'SetBotHidden'
  botId: PlayerId
  hidden: boolean
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
  | SetEquippedCommand
  | CreateBotCommand
  | SetInventorySizeCommand
  | SetBotHiddenCommand
  | RemoveBotCommand
  | SetLevelCommand
