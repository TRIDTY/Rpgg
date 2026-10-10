import type {
  Actor,
  CharacterProfile,
  ClientCommand,
  GameSession,
  InventorySlot,
  Item,
  JoinAcceptedEvent,
  JoinRejectedEvent,
  JoinRoomCommand,
  PlayerId,
  ServerEvent,
  SessionMember,
} from '../types'
import { MAX_LEVEL, MIN_LEVEL } from '../types'
import { newId, profileToActor } from '../domain/character'
import { addItem, moveItem, placeItem, removeItem, takeItem } from '../domain/inventory'
import { forgeItem, isValidItemInput } from '../domain/itemForge'
import type { ClientId, ServerAddress, ServerTransport } from './transport'

export interface HostSessionOptions {
  roomName: string
  password: string
  /** Eventos endereçados ao perfil com que o aparelho Host entrou na sala. */
  onLocalEvent: (event: ServerEvent) => void
  /** Chamado a cada mudança de estado da sessão (para persistir/exibir). */
  onSessionChange: (session: GameSession) => void
}

const isGameMaster = (member: SessionMember) => member.profile.Role === 'GM'
const isValidLevel = (level: unknown): level is number =>
  typeof level === 'number' && Number.isInteger(level) && level >= MIN_LEVEL && level <= MAX_LEVEL

/**
 * Fonte da verdade da sessão. Roda no aparelho que criou a sala: valida o
 * handshake (senha), mantém os inventários de todos os membros e propaga
 * eventos para os clientes através de um ServerTransport.
 *
 * A sala nasce sem jogador: o aparelho Host entra depois com um perfil
 * (`joinLocal`), que pode ser Jogador ou Mestre como qualquer outro membro.
 */
export class HostSession {
  readonly session: GameSession
  private readonly clientOf = new Map<PlayerId, ClientId>()
  private readonly playerOf = new Map<ClientId, PlayerId>()

  private readonly transport: ServerTransport
  private readonly options: HostSessionOptions

  constructor(transport: ServerTransport, options: HostSessionOptions) {
    this.transport = transport
    this.options = options
    this.session = {
      roomId: newId(),
      name: options.roomName,
      password: options.password,
      hostId: null,
      createdAt: new Date().toISOString(),
      members: {},
    }
  }

  /** Perfil local do aparelho Host (null enquanto só a rede está aberta). */
  get localPlayerId() {
    return this.session.hostId
  }

  start(port: number): Promise<ServerAddress> {
    return this.transport.start(port, {
      onConnect: () => {
        /* aguarda JoinRoom */
      },
      onMessage: (clientId, data) => this.onMessage(clientId, data),
      onDisconnect: (clientId) => this.onDisconnect(clientId),
    })
  }

  async stop() {
    await this.transport.stop()
  }

  /** Só quem está conectado agora aparece para os membros; quem saiu some da sidebar. */
  actors(): Actor[] {
    return this.onlineMembers().map((m) => profileToActor(m.profile, true))
  }

  private onlineMembers(): SessionMember[] {
    return Object.values(this.session.members).filter((m) => m.online)
  }

  /** Mestre ativo na sala (no máximo um), se houver. */
  activeGameMaster(): SessionMember | undefined {
    return this.onlineMembers().find(isGameMaster)
  }

  /**
   * Regras de admissão comuns ao Host local e aos clientes: cada sala abriga
   * estritamente um Mestre por vez (a reconexão do mesmo Mestre é permitida).
   */
  private admissionError(character: CharacterProfile): string | null {
    if (character.Role === 'GM') {
      const gm = this.activeGameMaster()
      if (gm && gm.profile.PlayerId !== character.PlayerId) {
        return `A sala já tem um Mestre ativo (${gm.profile.Name}). Entre com um perfil de Jogador.`
      }
    }
    return null
  }

  inventoryOf(playerId: PlayerId): InventorySlot[] | undefined {
    return this.session.members[playerId]?.profile.Inventory
  }

  /** O aparelho Host entra na própria sala com um perfil, sem passar pela rede. */
  joinLocal(profile: CharacterProfile): JoinAcceptedEvent | JoinRejectedEvent {
    const error = this.admissionError(profile)
    if (error) {
      console.warn(`[host] entrada local de ${profile.Name} (${profile.Role}) recusada: ${error}`)
      return { type: 'JoinRejected', reason: error }
    }
    const member = this.admit(profile)
    this.session.hostId = profile.PlayerId
    const accepted = this.acceptedEvent(member)
    console.log(`[host] ${profile.Name} (${profile.Role}) entrou na própria sala`)
    this.broadcastSession()
    this.notifyGameMasters(profile.PlayerId, member.profile.Inventory)
    this.changed()
    return accepted
  }

  /** Comandos vindos da UI do próprio Host. */
  handleLocalCommand(command: ClientCommand) {
    const playerId = this.session.hostId
    if (!playerId) {
      console.warn('[host] nenhum perfil local na sala; comando descartado', command)
      return
    }
    this.handleCommand(playerId, command)
  }

  private onMessage(clientId: ClientId, data: string) {
    let command: ClientCommand
    try {
      command = JSON.parse(data) as ClientCommand
    } catch {
      console.warn('[host] mensagem inválida de', clientId)
      return
    }
    if (command.type === 'JoinRoom') {
      this.handleJoin(clientId, command)
      return
    }
    const playerId = this.playerOf.get(clientId)
    if (!playerId) {
      this.transport.send(clientId, JSON.stringify({ type: 'JoinRejected', reason: 'Faça o handshake primeiro' }))
      return
    }
    this.handleCommand(playerId, command)
  }

  private handleJoin(clientId: ClientId, command: JoinRoomCommand) {
    const reject = (reason: string, disconnect = true) => {
      this.transport.send(clientId, JSON.stringify({ type: 'JoinRejected', reason } satisfies ServerEvent))
      if (disconnect) this.transport.disconnect(clientId)
    }
    if (command.password !== this.session.password) return reject('Senha da sala incorreta')
    const character = command.character
    if (!character?.PlayerId || !character.Name || !Array.isArray(character.Inventory)) {
      return reject('Ficha de personagem inválida')
    }
    if (character.PlayerId === this.session.hostId) return reject('Esse perfil já está em uso pelo Host')
    const error = this.admissionError(character)
    if (error) {
      console.warn(`[host] ${character.Name} (${character.Role}) recusado: ${error}`)
      return reject(error, false)
    }

    const previousClient = this.clientOf.get(character.PlayerId)
    if (previousClient && previousClient !== clientId) {
      this.playerOf.delete(previousClient)
      this.transport.disconnect(previousClient)
    }

    const member = this.admit(character)
    this.clientOf.set(character.PlayerId, clientId)
    this.playerOf.set(clientId, character.PlayerId)

    this.transport.send(clientId, JSON.stringify(this.acceptedEvent(member)))
    console.log(`[host] ${character.Name} (${character.Role}) entrou na sala (${character.PlayerId})`)
    this.broadcastSession()
    this.notifyGameMasters(character.PlayerId, member.profile.Inventory)
    this.changed()
  }

  /**
   * Registra (ou reativa) um membro preservando a Role escolhida na ficha.
   * Reconexão mantém o inventário que o Host conhece (fonte da verdade);
   * primeira entrada usa a ficha enviada.
   */
  private admit(character: CharacterProfile): SessionMember {
    const existing = this.session.members[character.PlayerId]
    const member: SessionMember = {
      profile: existing ? { ...character, Inventory: existing.profile.Inventory } : { ...character },
      online: true,
      joinedAt: existing?.joinedAt ?? new Date().toISOString(),
    }
    this.session.members[character.PlayerId] = member
    return member
  }

  private acceptedEvent(member: SessionMember): JoinAcceptedEvent {
    const playerId = member.profile.PlayerId
    const event: JoinAcceptedEvent = {
      type: 'JoinAccepted',
      playerId,
      roomName: this.session.name,
      actors: this.actors(),
      inventory: member.profile.Inventory,
    }
    if (isGameMaster(member)) {
      event.inventories = Object.fromEntries(
        Object.values(this.session.members)
          .filter((m) => m.profile.PlayerId !== playerId)
          .map((m) => [m.profile.PlayerId, m.profile.Inventory]),
      )
    }
    return event
  }

  private handleCommand(playerId: PlayerId, command: ClientCommand) {
    const member = this.session.members[playerId]
    if (!member) return

    switch (command.type) {
      case 'MoveItem': {
        const change = moveItem(member.profile.Inventory, command.fromSlot, command.toSlot)
        if (!change) return
        member.profile.Inventory = change.slots
        this.inventoryUpdated(playerId, change.changed)
        break
      }
      case 'DiscardItem': {
        const change = removeItem(member.profile.Inventory, command.slotIndex, command.itemId)
        if (!change) {
          console.warn(`[host] descarte inválido de ${member.profile.Name} no slot ${command.slotIndex}`)
          return
        }
        member.profile.Inventory = change.slots
        this.inventoryUpdated(playerId, change.changed)
        console.log(`[host] ${member.profile.Name} descartou ${change.item.icon} ${change.item.name} x${change.item.quantity}`)
        break
      }
      case 'InitiateTrade': {
        const target = this.session.members[command.targetPlayerId]
        if (!target || target === member) return
        const taken = takeItem(member.profile.Inventory, command.itemId)
        if (!taken) return
        const added = addItem(target.profile.Inventory, taken.item)
        if (!added) {
          console.warn(`[host] inventário de ${target.profile.Name} cheio; transferência cancelada`)
          return
        }
        member.profile.Inventory = taken.slots
        target.profile.Inventory = added.slots
        this.inventoryUpdated(playerId, taken.changed)
        this.inventoryUpdated(command.targetPlayerId, added.changed)
        this.sendTo(command.targetPlayerId, { type: 'ItemReceivedEvent', fromId: playerId, item: taken.item })
        console.log(`[host] ${member.profile.Name} -> ${target.profile.Name}: ${taken.item.name} x${taken.item.quantity}`)
        break
      }
      case 'CreateItem': {
        if (!isGameMaster(member)) {
          console.warn(`[host] ${member.profile.Name} tentou criar item sem ser Mestre`)
          return
        }
        const owner = this.session.members[command.ownerId]
        if (!owner || !isValidItemInput(command.item)) return
        const item = forgeItem(command.item)
        const change = placeItem(owner.profile.Inventory, command.slotIndex, item)
        if (!change) {
          console.warn(`[host] slot ${command.slotIndex} de ${owner.profile.Name} não está vazio`)
          return
        }
        owner.profile.Inventory = change.slots
        this.inventoryUpdated(command.ownerId, change.changed)
        if (command.ownerId !== playerId) {
          this.sendTo(command.ownerId, { type: 'ItemReceivedEvent', fromId: playerId, item })
        }
        console.log(`[host] forjou ${item.icon} ${item.name} (${item.id}) no slot ${command.slotIndex} de ${owner.profile.Name}`)
        break
      }
      case 'GiveItem': {
        if (!isGameMaster(member)) {
          console.warn(`[host] ${member.profile.Name} tentou dar item sem ser Mestre`)
          return
        }
        if (!this.giveItem(playerId, command.targetId, command.item)) return
        break
      }
      case 'SetLevel': {
        if (!isGameMaster(member)) {
          console.warn(`[host] ${member.profile.Name} tentou alterar nível sem ser Mestre`)
          return
        }
        const target = this.session.members[command.targetId]
        if (!target || !isValidLevel(command.level)) {
          console.warn(`[host] SetLevel inválido de ${member.profile.Name}`, command)
          return
        }
        if (target.profile.Level === command.level) return
        target.profile.Level = command.level
        target.profile.UpdatedAt = new Date().toISOString()
        this.broadcastSession()
        this.sendTo(command.targetId, {
          type: 'LevelChangedEvent',
          playerId: command.targetId,
          level: command.level,
          byId: playerId,
        })
        console.log(`[host] ${member.profile.Name} definiu nível ${command.level} para ${target.profile.Name}`)
        break
      }
      case 'JoinRoom':
        break
    }
    this.changed()
  }

  private giveItem(fromId: PlayerId, targetId: PlayerId, item: Item): boolean {
    const target = this.session.members[targetId]
    if (!target) return false
    const change = addItem(target.profile.Inventory, item)
    if (!change) return false
    target.profile.Inventory = change.slots
    this.inventoryUpdated(targetId, change.changed)
    this.sendTo(targetId, { type: 'ItemReceivedEvent', fromId, item })
    return true
  }

  private onDisconnect(clientId: ClientId) {
    const playerId = this.playerOf.get(clientId)
    if (!playerId) return
    this.playerOf.delete(clientId)
    this.clientOf.delete(playerId)
    const member = this.session.members[playerId]
    if (member) member.online = false
    this.broadcast({ type: 'ActorPresenceEvent', actorId: playerId, online: false })
    this.broadcastSession()
    this.changed()
  }

  /** Entrega a mudança ao dono e a todos os Mestres online (que enxergam as mochilas alheias). */
  private inventoryUpdated(ownerId: PlayerId, slots: InventorySlot[]) {
    this.sendTo(ownerId, { type: 'InventoryUpdatedEvent', ownerId, slots })
    this.notifyGameMasters(ownerId, slots)
  }

  private notifyGameMasters(ownerId: PlayerId, slots: InventorySlot[]) {
    for (const m of Object.values(this.session.members)) {
      if (m.online && isGameMaster(m) && m.profile.PlayerId !== ownerId) {
        this.sendTo(m.profile.PlayerId, { type: 'InventoryUpdatedEvent', ownerId, slots })
      }
    }
  }

  private sendTo(playerId: PlayerId, event: ServerEvent) {
    if (playerId === this.session.hostId) {
      this.options.onLocalEvent(event)
      return
    }
    const clientId = this.clientOf.get(playerId)
    if (clientId) this.transport.send(clientId, JSON.stringify(event))
  }

  private broadcast(event: ServerEvent) {
    if (this.session.hostId) this.options.onLocalEvent(event)
    this.transport.broadcast(JSON.stringify(event))
  }

  private broadcastSession() {
    this.broadcast({ type: 'SessionUpdatedEvent', roomName: this.session.name, actors: this.actors() })
  }

  private changed() {
    this.options.onSessionChange(this.session)
  }
}
