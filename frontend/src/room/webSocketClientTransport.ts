import type { ClientTransport, ClientTransportHandlers, ServerAddress } from './transport'

/** Cliente WebSocket padrão do navegador — conecta ao servidor local do Host (ws://IP:porta). */
export class WebSocketClientTransport implements ClientTransport {
  private socket: WebSocket | null = null

  private readonly address: ServerAddress

  constructor(address: ServerAddress) {
    this.address = address
  }

  connect(handlers: ClientTransportHandlers) {
    const socket = new WebSocket(`ws://${this.address.host}:${this.address.port}`)
    this.socket = socket
    socket.onopen = () => handlers.onOpen()
    socket.onmessage = (msg) => handlers.onMessage(String(msg.data))
    socket.onerror = () => {
      /* onclose é chamado em seguida com o motivo */
    }
    socket.onclose = (e) => {
      handlers.onClose(e.wasClean ? undefined : 'Não foi possível conectar ao Host')
    }
  }

  send(data: string) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(data)
  }

  close() {
    this.socket?.close()
    this.socket = null
  }
}
