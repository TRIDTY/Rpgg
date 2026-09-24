import type { ClientCommand, InventoryUpdatedEvent, ServerEvent } from '../types'
import { useInventoryStore } from '../store/inventoryStore'

type Unsubscribe = () => void

export interface RealtimeClient {
  connect: () => Unsubscribe
  send: (command: ClientCommand) => void
}

function dispatch(event: ServerEvent) {
  const store = useInventoryStore.getState()
  switch (event.type) {
    case 'InventoryUpdatedEvent':
      store.applyInventoryUpdated(event)
      break
    case 'ActorPresenceEvent':
      store.setActorOnline(event.actorId, event.online)
      break
  }
}

function createSocketClient(url: string): RealtimeClient {
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false

  const open = () => {
    socket = new WebSocket(url)
    socket.onopen = () => useInventoryStore.getState().setConnected(true)
    socket.onmessage = (msg) => {
      try {
        dispatch(JSON.parse(msg.data as string) as ServerEvent)
      } catch (err) {
        console.warn('[ws] mensagem inválida', err)
      }
    }
    socket.onclose = () => {
      useInventoryStore.getState().setConnected(false)
      if (!closedByUser) retryTimer = setTimeout(open, 2000)
    }
  }

  return {
    connect: () => {
      closedByUser = false
      open()
      return () => {
        closedByUser = true
        if (retryTimer) clearTimeout(retryTimer)
        socket?.close()
      }
    },
    send: (command) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(command))
      else console.warn('[ws] socket fechado, comando descartado', command)
    },
  }
}

/**
 * Simula o backend quando VITE_WS_URL não está definido: a cada alguns segundos
 * emite um InventoryUpdatedEvent (loot recebido) para exercitar a reatividade da grade.
 */
function createMockClient(): RealtimeClient {
  const LOOT = [
    { id: 'gold', name: 'Moedas de Ouro', icon: '🪙', maxStack: 999, rarity: 'common' as const },
    { id: 'potion-hp', name: 'Poção de Vida', icon: '🧪', maxStack: 20, rarity: 'uncommon' as const },
    { id: 'arrow', name: 'Flechas', icon: '➶', maxStack: 50, rarity: 'common' as const },
  ]

  return {
    connect: () => {
      const store = useInventoryStore.getState()
      store.setConnected(true)

      const timer = setInterval(() => {
        const { slots, selfId } = useInventoryStore.getState()
        const loot = LOOT[Math.floor(Math.random() * LOOT.length)]
        const stackable = slots.find(
          (s) => s.item?.id === loot.id && s.item.quantity < s.item.maxStack,
        )
        const target = stackable ?? slots.find((s) => s.item === null)
        if (!target) return

        const gained = 1 + Math.floor(Math.random() * 3)
        const quantity = Math.min(
          loot.maxStack,
          (stackable?.item?.quantity ?? 0) + gained,
        )
        const event: InventoryUpdatedEvent = {
          type: 'InventoryUpdatedEvent',
          ownerId: selfId,
          slots: [{ index: target.index, item: { ...loot, quantity } }],
        }
        dispatch(event)
      }, 8000)

      const presence = setInterval(() => {
        const { actors } = useInventoryStore.getState()
        const lyra = actors.find((a) => a.id === 'player-lyra')
        if (lyra) dispatch({ type: 'ActorPresenceEvent', actorId: lyra.id, online: !lyra.online })
      }, 15000)

      return () => {
        clearInterval(timer)
        clearInterval(presence)
        useInventoryStore.getState().setConnected(false)
      }
    },
    send: (command) => {
      console.info('[ws:mock] ->', command)
    },
  }
}

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined

export const realtimeClient: RealtimeClient = WS_URL ? createSocketClient(WS_URL) : createMockClient()
