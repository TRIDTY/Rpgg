import type { Actor, AttributeValue, CharacterProfile, InventorySlot, Item, PlayerRole } from '../types'
import { INVENTORY_CAPACITY, STARTER_KIT } from '../data/mockData'

export const DEFAULT_ATTRIBUTES: Record<string, AttributeValue> = {
  Força: 10,
  Destreza: 10,
  Constituição: 10,
  Inteligência: 10,
  Sabedoria: 10,
  Carisma: 10,
}

export const AVATAR_OPTIONS = ['🧝', '🧔', '🧚', '🧙', '🧛', '🧜', '🦹', '🧑‍🚀', '🐺', '🐉', '🦊', '🤖']

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
  starterKit: boolean
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
    Inventory: input.starterKit ? inventoryWithItems(STARTER_KIT) : emptyInventory(),
    CreatedAt: now,
    UpdatedAt: now,
  }
}

export function profileToActor(profile: CharacterProfile, online: boolean): Actor {
  return {
    id: profile.PlayerId,
    name: profile.Name,
    role: profile.Role === 'GM' ? 'master' : 'player',
    avatar: profile.Avatar,
    online,
    level: profile.Level,
    title: profile.Title,
    equipped: [],
  }
}
