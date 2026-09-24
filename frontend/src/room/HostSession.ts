import type {
  Actor,
  CharacterProfile,
  ClientCommand,
  GameSession,
  InventorySlot,
  Item,
  JoinRoomCommand,
  PlayerId,
  ServerEvent,
} from '../types'
import { newId, profileToActor } from '../domain/character'
import { addItem, moveItem, takeItem } from '../domain/inventory'
import type { ClientId, ServerAddress, ServerTransport } from './transport'

export interface HostSessionOptions {
  roomName: string
  password: string
  /** Eventos endereçados ao próprio Host (o Mestre também é um membro). */
  onLocalEvent: (event: ServerEvent) => void
  /** Chamado a cada mudança de estado da sessão (para persistir/exibir). */
  onSessionChange: (session: GameSession) => void
}

/**
 * Fonte da verdade da sessão. Roda no aparelho que criou a sala: valida o
 * handshake (senha), mantém os inventários de todos os membros e propaga
 * eventos para os clientes através de um ServerTransport.
 */
export class HostSession {
  readonly session: GameSession
  private readonly clientOf = new Map<PlayerId, ClientId>()
  private readonly playerOf = new Map<ClientId, PlayerId>()

  private readonly transport: ServerTransport
  private readonly options: HostSessionOptions

  constructor(hostProfile: CharacterProfile, transport: ServerTransport, options: HostSessionOptions) {
    this.transport = transport
    this.options = options
    const now = new Date().toISOString()
    this.session = {
      roomId: newId(),
      name: options.roomName,
      password: options.password,
      hostId: hostProfile.PlayerId,
      createdAt: now,
      members: {
        [hostProfile.PlayerId]: { profile: { ...hostProfile, Role: 'GM' }, online: true, joinedAt: now },
      },
    }
  }

  get hostId() {
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

  actors(): Actor[] {
    return Object.values(this.session.members).map((m) => profileToActor(m.profile, m.online))
  }

  inventoryOf(playerId: PlayerId): InventorySlot[] | undefined {
    return this.session.members[playerId]?.profile.Inventory
  }

  /** Comandos vindos da UI do próprio Host. */
  handleLocalCommand(command: ClientCommand) {
    this.handleCommand(this.hostId, command)
  }

  /** Ferramenta do Mestre: entrega um item a um membro. */
  giveItem(targetId: PlayerId, item: Item): boolean {
    const target = this.session.members[targetId]
    if (!target) return false
    const change = addItem(target.profile.Inventory, item)
    if (!change) return false
    target.profile.Inventory = change.slots
    this.sendTo(targetId, { type: 'InventoryUpdatedEvent', ownerId: targetId, slots: change.changed })
    this.sendTo(targetId, { type: 'ItemReceivedEvent', fromId: this.hostId, item })
    this.changed()
    return true
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
    const reject = (reason: string) => {
      this.transport.send(clientId, JSON.stringify({ type: 'JoinRejected', reason } satisfies ServerEvent))
      this.transport.disconnect(clientId)
    }
    if (command.password !== this.session.password) return reject('Senha da sala incorreta')
    const character = command.character
    if (!character?.PlayerId || !character.Name || !Array.isArray(character.Inventory)) {
      return reject('Ficha de personagem inválida')
    }

    const existing = this.session.members[character.PlayerId]
    const previousClient = this.clientOf.get(character.PlayerId)
    if (previousClient && previousClient !== clientId) {
      this.playerOf.delete(previousClient)
      this.transport.disconnect(previousClient)
    }

    // Reconexão mantém o inventário que o Host conhece (fonte da verdade);
    // primeira entrada usa a ficha enviada pelo cliente.
    const profile: CharacterProfile = existing
      ? { ...character, Role: 'Player', Inventory: existing.profile.Inventory }
      : { ...character, Role: 'Player' }
    this.session.members[character.PlayerId] = {
      profile,
      online: true,
      joinedAt: existing?.joinedAt ?? new Date().toISOString(),
    }
    this.clientOf.set(character.PlayerId, clientId)
    this.playerOf.set(clientId, character.PlayerId)

    this.transport.send(
      clientId,
      JSON.stringify({
        type: 'JoinAccepted',
        playerId: character.PlayerId,
        roomName: this.session.name,
        actors: this.actors(),
        inventory: profile.Inventory,
      } satisfies ServerEvent),
    )
    console.log(`[host] ${character.Name} entrou na sala (${character.PlayerId})`)
    this.broadcastSession()
    this.changed()
  }

  private handleCommand(playerId: PlayerId, command: ClientCommand) {
    const member = this.session.members[playerId]
    if (!member) return

    switch (command.type) {
      case 'MoveItem': {
        const change = moveItem(member.profile.Inventory, command.fromSlot, command.toSlot)
        if (!change) return
        member.profile.Inventory = change.slots
        this.sendTo(playerId, { type: 'InventoryUpdatedEvent', ownerId: playerId, slots: change.changed })
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
        this.sendTo(playerId, { type: 'InventoryUpdatedEvent', ownerId: playerId, slots: taken.changed })
        this.sendTo(command.targetPlayerId, {
          type: 'InventoryUpdatedEvent',
          ownerId: command.targetPlayerId,
          slots: added.changed,
        })
        this.sendTo(command.targetPlayerId, { type: 'ItemReceivedEvent', fromId: playerId, item: taken.item })
        console.log(`[host] ${member.profile.Name} -> ${target.profile.Name}: ${taken.item.name} x${taken.item.quantity}`)
        break
      }
      case 'JoinRoom':
        break
    }
    this.changed()
  }

  private onDisconnect(clientId: ClientId) {
    const playerId = this.playerOf.get(clientId)
    if (!playerId) return
    this.playerOf.delete(clientId)
    this.clientOf.delete(playerId)
    const member = this.session.members[playerId]
    if (member) member.online = false
    this.broadcast({ type: 'ActorPresenceEvent', actorId: playerId, online: false })
    this.changed()
  }

  private sendTo(playerId: PlayerId, event: ServerEvent) {
    if (playerId === this.hostId) {
      this.options.onLocalEvent(event)
      return
    }
    const clientId = this.clientOf.get(playerId)
    if (clientId) this.transport.send(clientId, JSON.stringify(event))
  }

  private broadcast(event: ServerEvent) {
    this.options.onLocalEvent(event)
    this.transport.broadcast(JSON.stringify(event))
  }

  private broadcastSession() {
    this.broadcast({ type: 'SessionUpdatedEvent', roomName: this.session.name, actors: this.actors() })
  }

  private changed() {
    this.options.onSessionChange(this.session)
  }
}
