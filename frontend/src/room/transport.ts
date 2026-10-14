export type ClientId = string

export interface ServerTransportHandlers {
  onConnect: (clientId: ClientId) => void
  onMessage: (clientId: ClientId, data: string) => void
  onDisconnect: (clientId: ClientId) => void
}

export interface ServerAddress {
  host: string
  port: number
}

/** Lado do Host: aceita conexões de clientes e troca mensagens de texto (JSON). */
export interface ServerTransport {
  start(port: number, handlers: ServerTransportHandlers): Promise<ServerAddress>
  send(clientId: ClientId, data: string): void
  broadcast(data: string): void
  disconnect(clientId: ClientId): void
  stop(): Promise<void>
}

export interface ClientTransportHandlers {
  onOpen: () => void
  onMessage: (data: string) => void
  onClose: (reason?: string) => void
}

/** Lado do Cliente: uma conexão com o Host. */
export interface ClientTransport {
  connect(handlers: ClientTransportHandlers): void
  send(data: string): void
  close(): void
}

export const LOOPBACK_HOST = 'local'
export const DEFAULT_ROOM_PORT = 8765

export function formatAddress(a: ServerAddress) {
  return a.host === LOOPBACK_HOST ? LOOPBACK_HOST : `${a.host}:${a.port}`
}

export function parseAddress(input: string): ServerAddress | null {
  const text = input.trim().replace(/^wss?:\/\//, '')
  if (!text) return null
  if (text === LOOPBACK_HOST) return { host: LOOPBACK_HOST, port: DEFAULT_ROOM_PORT }
  const [host, portText] = text.split(':')
  if (!host) return null
  const port = portText ? Number(portText) : DEFAULT_ROOM_PORT
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null
  return { host, port }
}
