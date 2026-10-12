import type { Actor, AttributeValue, CharacterProfile, InventorySlot, Item, PlayerRole } from '../types'
import { INVENTORY_CAPACITY } from '../data/mockData'

export const DEFAULT_ATTRIBUTES: Record<string, AttributeValue> = {
  Força: 10,
  Destreza: 10,
  Constituição: 10,
  Inteligência: 10,
  Sabedoria: 10,
  Carisma: 10,
}

export interface AvatarOption {
  icon: string
  label: string
}

export interface AvatarCategory {
  id: string
  label: string
  avatars: AvatarOption[]
}

const avatars = (pairs: [string, string][]): AvatarOption[] =>
  pairs.map(([icon, label]) => ({ icon, label }))

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: 'heroes',
    label: '🧙 Heróis',
    avatars: avatars([
      ['🧝', 'Elfo'],
      ['🧝‍♀️', 'Elfa'],
      ['🧔', 'Anão'],
      ['🧙', 'Mago'],
      ['🧙‍♀️', 'Feiticeira'],
      ['🧚', 'Fada'],
      ['🧛', 'Vampiro'],
      ['🧜', 'Tritão'],
      ['🧜‍♀️', 'Sereia'],
      ['🦸', 'Herói'],
      ['🦸‍♀️', 'Heroína'],
      ['🦹', 'Vilão'],
      ['🧞', 'Gênio'],
      ['🧌', 'Troll'],
      ['🤴', 'Príncipe'],
      ['👸', 'Princesa'],
      ['🫅', 'Monarca'],
      ['🥷', 'Ninja'],
      ['🤺', 'Esgrimista'],
      ['🏇', 'Cavaleiro'],
      ['💂', 'Guarda'],
      ['🕵️', 'Espião'],
      ['🤠', 'Pistoleiro'],
      ['👼', 'Anjo'],
      ['🧑‍🚀', 'Explorador'],
    ]),
  },
  {
    id: 'folk',
    label: '🧑‍🌾 Povo',
    avatars: avatars([
      ['🧑', 'Aventureiro'],
      ['👩', 'Aventureira'],
      ['👨', 'Viajante'],
      ['👴', 'Ancião'],
      ['👵', 'Anciã'],
      ['🧓', 'Sábio'],
      ['👶', 'Criança'],
      ['👳', 'Nômade'],
      ['🧕', 'Peregrina'],
      ['👲', 'Monge'],
      ['🧑‍🌾', 'Camponês'],
      ['🧑‍🍳', 'Cozinheiro'],
      ['🧑‍🔬', 'Alquimista'],
      ['🧑‍🏭', 'Ferreiro'],
      ['🧑‍⚕️', 'Curandeiro'],
      ['🧑‍🎨', 'Artista'],
      ['🧑‍🎤', 'Bardo'],
      ['🧑‍🎓', 'Erudito'],
      ['🧑‍💼', 'Mercador'],
      ['🧑‍✈️', 'Capitão'],
      ['🧑‍🔧', 'Engenhoqueiro'],
      ['👮', 'Patrulheiro'],
      ['🧑‍🦽', 'Veterano'],
      ['🤡', 'Bufão'],
    ]),
  },
  {
    id: 'dark',
    label: '👹 Sombrios',
    avatars: avatars([
      ['👹', 'Ogro'],
      ['👺', 'Duende'],
      ['👻', 'Fantasma'],
      ['💀', 'Caveira'],
      ['☠️', 'Morto-vivo'],
      ['🧟', 'Zumbi'],
      ['😈', 'Demônio'],
      ['👿', 'Diabrete'],
      ['👽', 'Alienígena'],
      ['👾', 'Invasor'],
      ['🤖', 'Autômato'],
      ['🎃', 'Abóbora'],
      ['🗿', 'Golem'],
      ['🔥', 'Elemental de fogo'],
      ['🌊', 'Elemental de água'],
      ['🌪️', 'Elemental de ar'],
      ['🪨', 'Elemental de terra'],
      ['⚡', 'Elemental de raio'],
      ['🌑', 'Sombra'],
      ['👁️', 'Observador'],
    ]),
  },
  {
    id: 'beasts',
    label: '🐺 Feras',
    avatars: avatars([
      ['🐺', 'Lobo'],
      ['🦊', 'Raposa'],
      ['🐻', 'Urso'],
      ['🐻‍❄️', 'Urso polar'],
      ['🦁', 'Leão'],
      ['🐯', 'Tigre'],
      ['🐆', 'Leopardo'],
      ['🐗', 'Javali'],
      ['🦌', 'Cervo'],
      ['🐴', 'Cavalo'],
      ['🦄', 'Unicórnio'],
      ['🐂', 'Touro'],
      ['🐏', 'Carneiro'],
      ['🐐', 'Bode'],
      ['🐘', 'Elefante'],
      ['🦏', 'Rinoceronte'],
      ['🦍', 'Gorila'],
      ['🐒', 'Macaco'],
      ['🐱', 'Gato'],
      ['🐶', 'Cão'],
      ['🐭', 'Camundongo'],
      ['🐰', 'Coelho'],
      ['🦝', 'Guaxinim'],
      ['🦡', 'Texugo'],
      ['🦇', 'Morcego'],
      ['🦉', 'Coruja'],
      ['🦅', 'Águia'],
      ['🦜', 'Papagaio'],
      ['🐦‍⬛', 'Corvo'],
      ['🦢', 'Cisne'],
      ['🐓', 'Galo'],
      ['🦆', 'Pato'],
      ['🐧', 'Pinguim'],
    ]),
  },
  {
    id: 'creatures',
    label: '🐉 Criaturas',
    avatars: avatars([
      ['🐉', 'Dragão'],
      ['🐲', 'Dragão jovem'],
      ['🦕', 'Dinossauro'],
      ['🦖', 'Tiranossauro'],
      ['🐊', 'Crocodilo'],
      ['🐍', 'Serpente'],
      ['🦎', 'Lagarto'],
      ['🐢', 'Tartaruga'],
      ['🐸', 'Sapo'],
      ['🐙', 'Polvo'],
      ['🦑', 'Lula'],
      ['🦈', 'Tubarão'],
      ['🐬', 'Golfinho'],
      ['🐳', 'Baleia'],
      ['🦀', 'Caranguejo'],
      ['🦂', 'Escorpião'],
      ['🕷️', 'Aranha'],
      ['🐝', 'Abelha'],
      ['🦋', 'Borboleta'],
      ['🐌', 'Lesma'],
      ['🐛', 'Lagarta'],
      ['🦗', 'Gafanhoto'],
      ['🪲', 'Besouro'],
      ['🐾', 'Fera'],
    ]),
  },
]

/** Todos os avatares em uma lista plana (ordem das categorias). */
export const AVATAR_OPTIONS: string[] = AVATAR_CATEGORIES.flatMap((c) =>
  c.avatars.map((a) => a.icon),
)

export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function emptyInventory(capacity = INVENTORY_CAPACITY): InventorySlot[] {
  return Array.from({ length: capacity }, (_, index) => ({ index, item: null }))
}

export function inventoryWithItems(items: Item[], capacity = INVENTORY_CAPACITY): InventorySlot[] {
  const slots = emptyInventory(capacity)
  items.forEach((item, i) => {
    if (i < slots.length) slots[i] = { index: i, item }
  })
  return slots
}

export interface NewCharacterInput {
  name: string
  role: PlayerRole
  avatar: string
  title?: string
  attributes: Record<string, AttributeValue>
}

export function createCharacter(input: NewCharacterInput): CharacterProfile {
  const now = new Date().toISOString()
  return {
    PlayerId: newId(),
    Name: input.name.trim(),
    Role: input.role,
    Avatar: input.avatar,
    Title: input.title?.trim() || undefined,
    Level: 1,
    Attributes: { ...input.attributes },
    Inventory: emptyInventory(),
    CreatedAt: now,
    UpdatedAt: now,
  }
}

export function profileToActor(profile: CharacterProfile, online: boolean): Actor {
  return {
    id: profile.PlayerId,
    name: profile.Name,
    role: profile.Role === 'GM' ? 'master' : profile.Role === 'Bot' ? 'bot' : 'player',
    avatar: profile.Avatar,
    online,
    level: profile.Level,
    title: profile.Title,
    equipped: profile.Inventory.flatMap((s) => (s.item?.equipped ? [s.item] : [])),
  }
}
