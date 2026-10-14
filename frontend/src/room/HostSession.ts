import type {
  Actor,
  CharacterProfile,
  ClientCommand,
  GameSession,
  InventorySlot,
  JoinAcceptedEvent,
  JoinRejectedEvent,
  JoinRoomCommand,
  PlayerId,
  ServerEvent,
  SessionMember,
} from '../types'
import { MAX_INVENTORY_SLOTS,
  MAX_LEVEL, MIN_LEVEL } from '../types'
import { createCharacter, newId, profileToActor } from '../domain/character'
import { addItem, moveItemAt, placeItem, removeItemAt, resizeInventory, setEquipped, takeItem, unequipped } from '../domain/inventory'
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
const isBot = (member: SessionMember) => member.profile.Role === 'Bot'
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
  /** Atores como `viewer` os enxerga: bots ocultos só aparecem para Mestres. */
  actors(viewer?: SessionMember): Actor[] {
    const seesHidden = viewer !== undefined && isGameMaster(viewer)
    return this.onlineMembers()
      .filter((m) => seesHidden || !m.hidden)
      .map((m) => (m.hidden ? { ...profileToActor(m.profile, true), hidden: true } : profileToActor(m.profile, true)))
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
    if (character.Role === 'Bot') return 'Perfis de bot só existem dentro da sala, criados pelo Mestre.'
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
      actors: this.actors(member),
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
        const change = moveItemAt(member.profile.Inventory, command.from, command.to)
        if (!change) return
        member.profile.Inventory = change.slots
        this.inventoryUpdated(playerId, change.changed)
        break
      }
      case 'DiscardItem': {
        const owner = this.managedMember(member, command.ownerId ?? playerId)
        if (!owner) return
        const change = removeItemAt(owner.profile.Inventory, { slot: command.slotIndex, inner: command.inner }, command.itemId)
        if (!change) {
          console.warn(`[host] descarte inválido de ${member.profile.Name} no slot ${command.slotIndex} de ${owner.profile.Name}`)
          return
        }
        owner.profile.Inventory = change.slots
        this.inventoryUpdated(owner.profile.PlayerId, change.changed)
        if (change.item.equipped) this.broadcastSession()
        console.log(`[host] ${member.profile.Name} descartou ${change.item.icon} ${change.item.name} x${change.item.quantity} de ${owner.profile.Name}`)
        break
      }
      case 'SetEquipped': {
        const owner = this.managedMember(member, command.ownerId ?? playerId)
        if (!owner || typeof command.equipped !== 'boolean') return
        const change = setEquipped(owner.profile.Inventory, command.slotIndex, command.itemId, command.equipped)
        if (!change) return
        owner.profile.Inventory = change.slots
        owner.profile.UpdatedAt = new Date().toISOString()
        this.inventoryUpdated(owner.profile.PlayerId, change.changed)
        this.broadcastSession()
        console.log(`[host] ${owner.profile.Name} ${command.equipped ? 'equipou' : 'desequipou'} ${change.item.icon} ${change.item.name}`)
        break
      }
      case 'TakeItem': {
        const owner = this.managedMember(member, command.ownerId)
        if (!owner || owner === member) return
        const taken = removeItemAt(owner.profile.Inventory, { slot: command.slotIndex, inner: command.inner }, command.itemId)
        if (!taken) return
        const added = addItem(member.profile.Inventory, unequipped(taken.item))
        if (!added) {
          console.warn(`[host] inventário de ${member.profile.Name} cheio; não pegou o item de ${owner.profile.Name}`)
          return
        }
        owner.profile.Inventory = taken.slots
        member.profile.Inventory = added.slots
        this.inventoryUpdated(owner.profile.PlayerId, taken.changed)
        this.inventoryUpdated(playerId, added.changed)
        if (taken.item.equipped) this.broadcastSession()
        console.log(`[host] ${member.profile.Name} pegou ${taken.item.name} x${taken.item.quantity} de ${owner.profile.Name}`)
        break
      }
      case 'CreateBot': {
        if (!isGameMaster(member)) {
          console.warn(`[host] ${member.profile.Name} tentou criar bot sem ser Mestre`)
          return
        }
        const name = typeof command.name === 'string' ? command.name.trim() : ''
        if (!name || typeof command.avatar !== 'string' || !command.avatar) return
        const bot = this.admit(createCharacter({ name, role: 'Bot', avatar: command.avatar, attributes: {} }))
        bot.hidden = command.hidden === true
        this.broadcastSession()
        this.notifyGameMasters(bot.profile.PlayerId, bot.profile.Inventory)
        console.log(`[host] ${member.profile.Name} criou o bot ${bot.profile.Avatar} ${name} (${bot.profile.PlayerId})`)
        break
      }
      case 'SetInventorySize': {
        if (!isGameMaster(member)) return
        const target = this.session.members[command.targetId]
        if (!target || isGameMaster(target)) return
        if (!Number.isInteger(command.size) || command.size < 1 || command.size > MAX_INVENTORY_SLOTS) return
        const slots = resizeInventory(target.profile.Inventory, command.size)
        if (!slots) {
          console.warn(`[host] mochila de ${target.profile.Name} tem itens além do slot ${command.size}; redimensionamento recusado`)
          return
        }
        target.profile.Inventory = slots
        target.profile.UpdatedAt = new Date().toISOString()
        this.sendTo(command.targetId, { type: 'InventoryUpdatedEvent', ownerId: command.targetId, slots, size: slots.length })
        for (const m of this.onlineMembers()) {
          if (isGameMaster(m) && m.profile.PlayerId !== command.targetId) {
            this.sendTo(m.profile.PlayerId, { type: 'InventoryUpdatedEvent', ownerId: command.targetId, slots, size: slots.length })
          }
        }
        this.broadcastSession()
        console.log(`[host] ${member.profile.Name} definiu ${slots.length} slots para ${target.profile.Name}`)
        break
      }
      case 'SetBotHidden': {
        if (!isGameMaster(member) || typeof command.hidden !== 'boolean') return
        const bot = this.session.members[command.botId]
        if (!bot || !isBot(bot)) return
        bot.hidden = command.hidden
        this.broadcastSession()
        console.log(`[host] ${member.profile.Name} ${command.hidden ? 'ocultou' : 'revelou'} o bot ${bot.profile.Name}`)
        break
      }
      case 'RemoveBot': {
        if (!isGameMaster(member)) return
        const bot = this.session.members[command.botId]
        if (!bot || !isBot(bot)) return
        delete this.session.members[command.botId]
        this.broadcast({ type: 'ActorPresenceEvent', actorId: command.botId, online: false })
        this.broadcastSession()
        console.log(`[host] ${member.profile.Name} removeu o bot ${bot.profile.Name}`)
        break
      }
      case 'InitiateTrade': {
        const target = this.session.members[command.targetPlayerId]
        if (!target || target === member) return
        if (target.hidden && !isGameMaster(member)) return
        const taken = takeItem(member.profile.Inventory, command.itemId)
        if (!taken) return
        const added = addItem(target.profile.Inventory, unequipped(taken.item))
        if (!added) {
          console.warn(`[host] inventário de ${target.profile.Name} cheio; transferência cancelada`)
          return
        }
        member.profile.Inventory = taken.slots
        target.profile.Inventory = added.slots
        this.inventoryUpdated(playerId, taken.changed)
        this.inventoryUpdated(command.targetPlayerId, added.changed)
        this.sendTo(command.targetPlayerId, { type: 'ItemReceivedEvent', fromId: playerId, item: unequipped(taken.item) })
        if (taken.item.equipped) this.broadcastSession()
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

  /** Mochila que `member` pode editar diretamente: a própria ou, se for Mestre, a de um bot. */
  private managedMember(member: SessionMember, ownerId: PlayerId): SessionMember | undefined {
    const owner = this.session.members[ownerId]
    if (!owner) return undefined
    if (owner === member || (isGameMaster(member) && isBot(owner))) return owner
    console.warn(`[host] ${member.profile.Name} não pode editar a mochila de ${owner.profile.Name}`)
    return undefined
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

  /** Cada membro recebe a lista de atores que lhe cabe ver (bots ocultos só para Mestres). */
  private broadcastSession() {
    for (const m of this.onlineMembers()) {
      if (isBot(m)) continue
      this.sendTo(m.profile.PlayerId, { type: 'SessionUpdatedEvent', roomName: this.session.name, actors: this.actors(m) })
    }
  }

  private changed() {
    this.options.onSessionChange(this.session)
  }
}
