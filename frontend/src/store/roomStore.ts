import { create } from 'zustand'
import type {
  CharacterProfile,
  ClientCommand,
  GameSession,
  InventorySlot,
  Item,
  JoinAcceptedEvent,
  PlayerId,
  RoomInfo,
  ServerEvent,
} from '../types'
import { profileToActor } from '../domain/character'
import { HostSession } from '../room/HostSession'
import { ClientSession } from '../room/ClientSession'
import { LoopbackClientTransport, LoopbackServerTransport } from '../room/loopbackTransport'
import { NativeServerTransport, isNativeRoomServerAvailable } from '../room/nativeRoomServer'
import { WebSocketClientTransport } from '../room/webSocketClientTransport'
import { LOOPBACK_HOST, type ClientTransport, type ServerAddress } from '../room/transport'
import { characterRepository, sessionRepository } from '../storage/repositories'
import { useInventoryStore } from './inventoryStore'

/**
 * Camada de rede, independente do perfil:
 * - `hosting`: servidor local aberto neste aparelho;
 * - `lobby`: conectado a um Host, aguardando a escolha da ficha;
 * - `joined`: cliente com handshake aceito.
 * Em `hosting`/`joined`, `self` indica com qual ficha este aparelho está jogando.
 */
export type RoomMode = 'idle' | 'starting' | 'hosting' | 'connecting' | 'lobby' | 'joined'

interface RoomState {
  mode: RoomMode
  room: RoomInfo | null
  session: GameSession | null
  error: string | null
  /** Transporte em uso pelo Host: nativo (WebSocket na LAN) ou loopback (mesmo navegador). */
  serverKind: 'native' | 'loopback' | null
  /** Ficha com que este aparelho entrou na sala (null enquanto só a rede está pronta). */
  self: CharacterProfile | null
  /** Mochilas dos outros membros — o Host só envia para quem é Mestre. */
  inventories: Record<PlayerId, InventorySlot[]>

  startHosting: (opts: { roomName: string; password: string; port: number }) => Promise<void>
  connectToRoom: (address: ServerAddress, password: string) => Promise<void>
  /** Entra na sala aberta/conectada com a ficha escolhida (Host: local; Cliente: handshake). */
  joinAs: (profile: CharacterProfile) => Promise<boolean>
  leave: () => Promise<void>
  sendCommand: (command: ClientCommand) => void
  giveItem: (targetId: PlayerId, item: Item) => void
  clearError: () => void
}

let host: HostSession | null = null
let client: ClientSession | null = null
let pendingJoin: ((accepted: boolean) => void) | null = null

const settleJoin = (accepted: boolean) => {
  pendingJoin?.(accepted)
  pendingJoin = null
}

function patchSlots(current: InventorySlot[] | undefined, incoming: InventorySlot[]) {
  const size = Math.max(current?.length ?? 0, ...incoming.map((s) => s.index + 1))
  const next: InventorySlot[] = Array.from({ length: size }, (_, index) => current?.[index] ?? { index, item: null })
  for (const slot of incoming) next[slot.index] = { index: slot.index, item: slot.item }
  return next
}

export const useRoomStore = create<RoomState>((set, get) => {
  /** Aplica um evento do Host ao estado reativo local e persiste o save game quando o inventário muda. */
  const dispatchServerEvent = (event: ServerEvent) => {
    const inv = useInventoryStore.getState()
    const selfId = get().self?.PlayerId
    switch (event.type) {
      case 'InventoryUpdatedEvent':
        if (event.ownerId === selfId) {
          inv.applyInventoryUpdated(event)
          void characterRepository.updateInventory(selfId, useInventoryStore.getState().slots)
        } else {
          set((s) => ({
            inventories: { ...s.inventories, [event.ownerId]: patchSlots(s.inventories[event.ownerId], event.slots) },
          }))
        }
        break
      case 'ActorPresenceEvent':
        inv.setActorOnline(event.actorId, event.online)
        break
      case 'SessionUpdatedEvent':
        inv.setActors(event.actors)
        break
      case 'ItemReceivedEvent': {
        const from = inv.actors.find((a) => a.id === event.fromId)
        inv.pushNotice(`${from?.name ?? 'Alguém'} enviou ${event.item.icon} ${event.item.name} x${event.item.quantity}`)
        break
      }
      case 'JoinAccepted':
      case 'JoinRejected':
        break
    }
  }

  const applyAccepted = (profile: CharacterProfile, event: JoinAcceptedEvent) => {
    useInventoryStore.getState().hydrate({
      selfId: event.playerId,
      roomName: event.roomName,
      slots: event.inventory,
      actors: event.actors,
    })
    useInventoryStore.getState().setConnected(true)
    void characterRepository.updateInventory(event.playerId, event.inventory)
    set({ self: { ...profile, Inventory: event.inventory }, inventories: event.inventories ?? {}, error: null })
  }

  return {
    mode: 'idle',
    room: null,
    session: null,
    error: null,
    serverKind: null,
    self: null,
    inventories: {},

    startHosting: async ({ roomName, password, port }) => {
      await get().leave()
      set({ mode: 'starting', error: null })

      const native = isNativeRoomServerAvailable()
      const transport = native ? new NativeServerTransport() : new LoopbackServerTransport()

      const session = new HostSession(transport, {
        roomName,
        password,
        onLocalEvent: dispatchServerEvent,
        onSessionChange: (s) => {
          set({ session: { ...s, members: { ...s.members } } })
          void sessionRepository.save(s)
        },
      })

      try {
        const address = await session.start(port)
        host = session
        void sessionRepository.save(session.session)
        set({
          mode: 'hosting',
          serverKind: native ? 'native' : 'loopback',
          session: session.session,
          room: { roomId: session.session.roomId, name: roomName, host: address.host, port: address.port, password },
        })
      } catch (err) {
        set({ mode: 'idle', error: err instanceof Error ? err.message : 'Falha ao iniciar o servidor local' })
      }
    },

    connectToRoom: async (address, password) => {
      await get().leave()
      set({ mode: 'connecting', error: null })

      const transport: ClientTransport =
        address.host === LOOPBACK_HOST
          ? new LoopbackClientTransport(address.port)
          : new WebSocketClientTransport(address)

      await new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (!settled) {
            settled = true
            resolve()
          }
        }
        const session = new ClientSession(transport, {
          onOpen: () => {
            set({ mode: 'lobby', room: { roomId: '', name: '', host: address.host, port: address.port, password } })
            finish()
          },
          onEvent: (event) => {
            if (event.type === 'JoinAccepted') {
              const profile = get().self
              if (profile) applyAccepted(profile, event)
              set((s) => ({ mode: 'joined', room: s.room && { ...s.room, name: event.roomName } }))
              settleJoin(true)
              return
            }
            if (event.type === 'JoinRejected') {
              set({ mode: 'lobby', self: null, error: event.reason })
              settleJoin(false)
              return
            }
            dispatchServerEvent(event)
          },
          onClose: (reason) => {
            useInventoryStore.getState().setConnected(false)
            const { mode } = get()
            if (mode === 'connecting' || mode === 'lobby' || mode === 'joined') {
              set({ mode: 'idle', self: null, room: null, error: reason ?? 'Conexão encerrada' })
            }
            client = null
            settleJoin(false)
            finish()
          },
        })
        client = session
        session.connect()
      })
    },

    joinAs: async (profile) => {
      const { mode } = get()
      if (host && mode === 'hosting') {
        const accepted = host.joinLocal(profile)
        applyAccepted(profile, accepted)
        return true
      }
      if (client && (mode === 'lobby' || mode === 'joined')) {
        set({ self: profile, error: null })
        return new Promise<boolean>((resolve) => {
          settleJoin(false)
          pendingJoin = resolve
          client?.join(profile, get().room?.password ?? '')
        })
      }
      set({ error: 'Nenhuma sala aberta ou conectada' })
      return false
    },

    leave: async () => {
      if (host) {
        await host.stop()
        host = null
      }
      if (client) {
        client.close()
        client = null
      }
      settleJoin(false)
      useInventoryStore.getState().reset()
      set({ mode: 'idle', room: null, session: null, serverKind: null, self: null, inventories: {} })
    },

    sendCommand: (command) => {
      if (host) host.handleLocalCommand(command)
      else if (client) client.send(command)
      else console.warn('[room] sem sessão ativa; comando descartado', command)
    },

    giveItem: (targetId, item) => {
      get().sendCommand({ type: 'GiveItem', targetId, item })
    },

    clearError: () => set({ error: null }),
  }
})

export const membersOf = (session: GameSession | null) =>
  session ? Object.values(session.members).map((m) => profileToActor(m.profile, m.online)) : []
