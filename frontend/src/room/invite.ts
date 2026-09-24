import { DEFAULT_ROOM_PORT, parseAddress, type ServerAddress } from './transport'

export interface Invite {
  address: ServerAddress
  password: string
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomPassword(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Conteúdo do QR Code / link de convite: rpgg://join?h=<ip>&p=<porta>&k=<senha> */
export function encodeInvite(invite: Invite) {
  const q = new URLSearchParams({
    h: invite.address.host,
    p: String(invite.address.port),
    k: invite.password,
  })
  return `rpgg://join?${q.toString()}`
}

/** Aceita o link de convite completo ou apenas "IP:porta". */
export function parseInvite(text: string): Partial<Invite> | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('rpgg://')) {
    const q = new URLSearchParams(trimmed.slice(trimmed.indexOf('?') + 1))
    const host = q.get('h')
    if (!host) return null
    const port = Number(q.get('p') ?? DEFAULT_ROOM_PORT)
    return { address: { host, port }, password: q.get('k') ?? undefined }
  }
  const address = parseAddress(trimmed)
  return address ? { address } : null
}
