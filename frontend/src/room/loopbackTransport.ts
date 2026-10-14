import { newId } from '../domain/character'
import {
  LOOPBACK_HOST,
  type ClientId,
  type ClientTransport,
  type ClientTransportHandlers,
  type ServerAddress,
  type ServerTransport,
  type ServerTransportHandlers,
} from './transport'

/**
 * Transporte de desenvolvimento/demonstração: liga Host e Clientes abertos no
 * MESMO navegador (abas diferentes) através de um BroadcastChannel, seguindo o
 * mesmo contrato do servidor WebSocket nativo. Permite testar o handshake sem
 * o app Android.
 */

type Frame =
  | { kind: 'hello'; clientId: ClientId }
  | { kind: 'msg'; clientId: ClientId; data: string; dir: 'up' | 'down' }
  | { kind: 'bye'; clientId: ClientId; dir: 'up' | 'down' }
  | { kind: 'server-down' }
  | { kind: 'welcome'; clientId: ClientId }

const channelName = (port: number) => `rpgg-room-${port}`

export class LoopbackServerTransport implements ServerTransport {
  private channel: BroadcastChannel | null = null
  private clients = new Set<ClientId>()
  private handlers: ServerTransportHandlers | null = null

  async start(port: number, handlers: ServerTransportHandlers): Promise<ServerAddress> {
    if (typeof BroadcastChannel === 'undefined') {
      throw new Error('BroadcastChannel indisponível neste navegador')
    }
    this.handlers = handlers
    this.channel = new BroadcastChannel(channelName(port))
    this.channel.onmessage = (e: MessageEvent<Frame>) => {
      const f = e.data
      if (f.kind === 'hello') {
        this.clients.add(f.clientId)
        this.channel?.postMessage({ kind: 'welcome', clientId: f.clientId } satisfies Frame)
        this.handlers?.onConnect(f.clientId)
      } else if (f.kind === 'msg' && f.dir === 'up' && this.clients.has(f.clientId)) {
        this.handlers?.onMessage(f.clientId, f.data)
      } else if (f.kind === 'bye' && f.dir === 'up' && this.clients.delete(f.clientId)) {
        this.handlers?.onDisconnect(f.clientId)
      }
    }
    return { host: LOOPBACK_HOST, port }
  }

  send(clientId: ClientId, data: string) {
    this.channel?.postMessage({ kind: 'msg', clientId, data, dir: 'down' } satisfies Frame)
  }

  broadcast(data: string) {
    for (const id of this.clients) this.send(id, data)
  }

  disconnect(clientId: ClientId) {
    if (!this.clients.delete(clientId)) return
    this.channel?.postMessage({ kind: 'bye', clientId, dir: 'down' } satisfies Frame)
    this.handlers?.onDisconnect(clientId)
  }

  async stop() {
    this.channel?.postMessage({ kind: 'server-down' } satisfies Frame)
    this.channel?.close()
    this.channel = null
    this.clients.clear()
  }
}

export class LoopbackClientTransport implements ClientTransport {
  private channel: BroadcastChannel | null = null
  private readonly clientId = newId()
  private open = false
  private handlers: ClientTransportHandlers | null = null
  private helloTimer: ReturnType<typeof setTimeout> | null = null

  private readonly port: number

  constructor(port: number) {
    this.port = port
  }

  connect(handlers: ClientTransportHandlers) {
    this.handlers = handlers
    this.channel = new BroadcastChannel(channelName(this.port))
    this.channel.onmessage = (e: MessageEvent<Frame>) => {
      const f = e.data
      if (f.kind === 'welcome' && f.clientId === this.clientId) {
        if (this.helloTimer) clearTimeout(this.helloTimer)
        this.open = true
        this.handlers?.onOpen()
      } else if (f.kind === 'msg' && f.dir === 'down' && f.clientId === this.clientId) {
        this.handlers?.onMessage(f.data)
      } else if ((f.kind === 'bye' && f.dir === 'down' && f.clientId === this.clientId) || f.kind === 'server-down') {
        this.teardown('Sala encerrada pelo Host')
      }
    }
    this.channel.postMessage({ kind: 'hello', clientId: this.clientId } satisfies Frame)
    this.helloTimer = setTimeout(() => {
      if (!this.open) this.teardown('Nenhuma sala local encontrada neste navegador')
    }, 1500)
  }

  send(data: string) {
    if (!this.open) return
    this.channel?.postMessage({ kind: 'msg', clientId: this.clientId, data, dir: 'up' } satisfies Frame)
  }

  close() {
    if (this.open) this.channel?.postMessage({ kind: 'bye', clientId: this.clientId, dir: 'up' } satisfies Frame)
    this.teardown()
  }

  private teardown(reason?: string) {
    if (this.helloTimer) clearTimeout(this.helloTimer)
    const wasOpenOrPending = this.channel !== null
    this.channel?.close()
    this.channel = null
    this.open = false
    if (wasOpenOrPending) this.handlers?.onClose(reason)
  }
}
