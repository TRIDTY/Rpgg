import type { CharacterProfile, ClientCommand, ServerEvent } from '../types'
import type { ClientTransport } from './transport'

export interface ClientSessionOptions {
  password: string
  onEvent: (event: ServerEvent) => void
  onClose: (reason?: string) => void
}

/**
 * Lado do jogador: abre a conexão, envia a ficha local no handshake (JoinRoom)
 * e repassa os eventos do Host para a aplicação.
 */
export class ClientSession {
  private readonly profile: CharacterProfile
  private readonly transport: ClientTransport
  private readonly options: ClientSessionOptions

  constructor(profile: CharacterProfile, transport: ClientTransport, options: ClientSessionOptions) {
    this.profile = profile
    this.transport = transport
    this.options = options
  }

  connect() {
    this.transport.connect({
      onOpen: () => {
        const handshake: ClientCommand = {
          type: 'JoinRoom',
          password: this.options.password,
          character: this.profile,
        }
        console.log(`[client] handshake JoinRoom como ${this.profile.Name}`)
        this.transport.send(JSON.stringify(handshake))
      },
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

  send(command: ClientCommand) {
    this.transport.send(JSON.stringify(command))
  }

  close() {
    this.transport.close()
  }
}
