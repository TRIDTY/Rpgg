import { create } from 'zustand'
import type { CharacterProfile, ClientCommand, GameSession, Item, PlayerId, RoomInfo, ServerEvent } from '../types'
import { profileToActor } from '../domain/character'
import { HostSession } from '../room/HostSession'
import { ClientSession } from '../room/ClientSession'
import { LoopbackClientTransport, LoopbackServerTransport } from '../room/loopbackTransport'
import { NativeServerTransport, isNativeRoomServerAvailable } from '../room/nativeRoomServer'
import { WebSocketClientTransport } from '../room/webSocketClientTransport'
import { LOOPBACK_HOST, type ClientTransport, type ServerAddress } from '../room/transport'
import { characterRepository, sessionRepository } from '../storage/repositories'
import { useInventoryStore } from './inventoryStore'

export type RoomMode = 'idle' | 'starting' | 'hosting' | 'connecting' | 'joined'

interface RoomState {
  mode: RoomMode
  room: RoomInfo | null
  session: GameSession | null
  error: string | null
  /** Transporte em uso pelo Host: nativo (WebSocket na LAN) ou loopback (mesmo navegador). */
  serverKind: 'native' | 'loopback' | null

  startHosting: (profile: CharacterProfile, opts: { roomName: string; password: string; port: number }) => Promise<void>
  joinRoom: (profile: CharacterProfile, address: ServerAddress, password: string) => Promise<void>
  leave: () => Promise<void>
  sendCommand: (command: ClientCommand) => void
  giveItem: (targetId: PlayerId, item: Item) => void
  clearError: () => void
}

let host: HostSession | null = null
let client: ClientSession | null = null

/** Aplica um evento do Host ao estado reativo local e persiste o save game quando o inventário muda. */
function dispatchServerEvent(event: ServerEvent, selfId: PlayerId) {
  const inv = useInventoryStore.getState()
  switch (event.type) {
    case 'InventoryUpdatedEvent':
      inv.applyInventoryUpdated(event)
      if (event.ownerId === selfId) {
        void characterRepository.updateInventory(selfId, useInventoryStore.getState().slots)
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

export const useRoomStore = create<RoomState>((set, get) => ({
  mode: 'idle',
  room: null,
  session: null,
  error: null,
  serverKind: null,

  startHosting: async (profile, { roomName, password, port }) => {
    await get().leave()
    set({ mode: 'starting', error: null })

    const native = isNativeRoomServerAvailable()
    const transport = native ? new NativeServerTransport() : new LoopbackServerTransport()
    const hostProfile: CharacterProfile = { ...profile, Role: 'GM' }

    const session = new HostSession(hostProfile, transport, {
      roomName,
      password,
      onLocalEvent: (event) => dispatchServerEvent(event, hostProfile.PlayerId),
      onSessionChange: (s) => {
        set({ session: { ...s, members: { ...s.members } } })
        void sessionRepository.save(s)
      },
    })

    try {
      const address = await session.start(port)
      host = session
      useInventoryStore.getState().hydrate({
        selfId: hostProfile.PlayerId,
        roomName,
        slots: hostProfile.Inventory,
        actors: session.actors(),
      })
      useInventoryStore.getState().setConnected(true)
      await characterRepository.save(hostProfile)
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

  joinRoom: async (profile, address, password) => {
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
      const session = new ClientSession(profile, transport, {
        password,
        onEvent: (event) => {
          if (event.type === 'JoinAccepted') {
            useInventoryStore.getState().hydrate({
              selfId: event.playerId,
              roomName: event.roomName,
              slots: event.inventory,
              actors: event.actors,
            })
            useInventoryStore.getState().setConnected(true)
            void characterRepository.updateInventory(event.playerId, event.inventory)
            set({
              mode: 'joined',
              room: { roomId: '', name: event.roomName, host: address.host, port: address.port, password },
            })
            finish()
            return
          }
          if (event.type === 'JoinRejected') {
            set({ mode: 'idle', error: event.reason })
            session.close()
            client = null
            finish()
            return
          }
          dispatchServerEvent(event, profile.PlayerId)
        },
        onClose: (reason) => {
          useInventoryStore.getState().setConnected(false)
          if (get().mode === 'connecting') {
            set({ mode: 'idle', error: reason ?? 'Conexão encerrada' })
          } else if (get().mode === 'joined' && reason) {
            set({ error: reason })
          }
          client = null
          finish()
        },
      })
      client = session
      session.connect()
    })
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
    useInventoryStore.getState().reset()
    set({ mode: 'idle', room: null, session: null, serverKind: null })
  },

  sendCommand: (command) => {
    if (host) host.handleLocalCommand(command)
    else if (client) client.send(command)
    else console.warn('[room] sem sessão ativa; comando descartado', command)
  },

  giveItem: (targetId, item) => {
    host?.giveItem(targetId, item)
  },

  clearError: () => set({ error: null }),
}))

export const membersOf = (session: GameSession | null) =>
  session ? Object.values(session.members).map((m) => profileToActor(m.profile, m.online)) : []
