import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { ClientId, ServerAddress, ServerTransport, ServerTransportHandlers } from './transport'

/**
 * Contrato do plugin nativo `RoomServer` (android/.../RoomServerPlugin.java):
 * um servidor WebSocket rodando no próprio aparelho, na porta pedida.
 */
export interface RoomServerPlugin {
  start(options: { port: number }): Promise<ServerAddress>
  stop(): Promise<void>
  send(options: { clientId: ClientId; data: string }): Promise<void>
  broadcast(options: { data: string }): Promise<void>
  disconnect(options: { clientId: ClientId }): Promise<void>
  addListener(event: 'connected', fn: (e: { clientId: ClientId }) => void): Promise<PluginListenerHandle>
  addListener(
    event: 'message',
    fn: (e: { clientId: ClientId; data: string }) => void,
  ): Promise<PluginListenerHandle>
  addListener(event: 'disconnected', fn: (e: { clientId: ClientId }) => void): Promise<PluginListenerHandle>
}

export const RoomServer = registerPlugin<RoomServerPlugin>('RoomServer')

export const isNativeRoomServerAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('RoomServer')

export class NativeServerTransport implements ServerTransport {
  private listeners: PluginListenerHandle[] = []

  async start(port: number, handlers: ServerTransportHandlers): Promise<ServerAddress> {
    this.listeners = await Promise.all([
      RoomServer.addListener('connected', (e) => handlers.onConnect(e.clientId)),
      RoomServer.addListener('message', (e) => handlers.onMessage(e.clientId, e.data)),
      RoomServer.addListener('disconnected', (e) => handlers.onDisconnect(e.clientId)),
    ])
    return RoomServer.start({ port })
  }

  send(clientId: ClientId, data: string) {
    void RoomServer.send({ clientId, data })
  }

  broadcast(data: string) {
    void RoomServer.broadcast({ data })
  }

  disconnect(clientId: ClientId) {
    void RoomServer.disconnect({ clientId })
  }

  async stop() {
    await Promise.all(this.listeners.map((l) => l.remove()))
    this.listeners = []
    await RoomServer.stop()
  }
}
