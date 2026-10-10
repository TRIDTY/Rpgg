import type { CharacterProfile, ClientCommand, ServerEvent } from '../types'
import type { ClientTransport } from './transport'

export interface ClientSessionOptions {
  onOpen: () => void
  onEvent: (event: ServerEvent) => void
  onClose: (reason?: string) => void
}

/**
 * Lado do jogador. A conexão é aberta primeiro (camada de rede); o handshake
 * `JoinRoom` só é enviado depois que o usuário escolhe com qual ficha entrar.
 */
export class ClientSession {
  private readonly transport: ClientTransport
  private readonly options: ClientSessionOptions

  constructor(transport: ClientTransport, options: ClientSessionOptions) {
    this.transport = transport
    this.options = options
  }

  connect() {
    this.transport.connect({
      onOpen: () => this.options.onOpen(),
      onMessage: (data) => {
        try {
          this.options.onEvent(JSON.parse(data) as ServerEvent)
        } catch (err) {
          console.warn('[client] evento inválido', err)
        }
      },
      onClose: (reason) => this.options.onClose(reason),
    })
  }

  join(profile: CharacterProfile, password: string) {
    const handshake: ClientCommand = { type: 'JoinRoom', password, character: profile }
    console.log(`[client] handshake JoinRoom como ${profile.Name} (${profile.Role})`)
    this.send(handshake)
  }

  send(command: ClientCommand) {
    this.transport.send(JSON.stringify(command))
  }

  close() {
    this.transport.close()
  }
}
