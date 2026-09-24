import type { Actor, InventorySlot, Item } from '../types'

export const SELF_ID = 'player-self'

const item = (
  id: string,
  name: string,
  icon: string,
  quantity: number,
  rarity: Item['rarity'],
  maxStack = 99,
  description?: string,
): Item => ({ id, name, icon, quantity, maxStack, rarity, description })

export const INITIAL_ITEMS: Item[] = [
  item('sword-iron', 'Espada de Ferro', '🗡️', 1, 'common', 1, 'Uma lâmina simples, mas confiável.'),
  item('potion-hp', 'Poção de Vida', '🧪', 12, 'uncommon', 20, 'Restaura 50 PV.'),
  item('shield-oak', 'Escudo de Carvalho', '🛡️', 1, 'common', 1),
  item('gold', 'Moedas de Ouro', '🪙', 87, 'common', 999),
  item('bow-elven', 'Arco Élfico', '🏹', 1, 'rare', 1, 'Leve e silencioso.'),
  item('scroll-fire', 'Pergaminho de Fogo', '📜', 3, 'epic', 10, 'Conjura Bola de Fogo.'),
  item('gem-ruby', 'Rubi', '💎', 4, 'rare', 50),
  item('bread', 'Pão', '🍞', 6, 'common', 30),
  item('key-old', 'Chave Antiga', '🗝️', 1, 'uncommon', 1),
  item('ring-void', 'Anel do Vazio', '💍', 1, 'legendary', 1, 'Sussurra segredos esquecidos.'),
  item('torch', 'Tocha', '🔥', 5, 'common', 20),
  item('herb', 'Erva Curativa', '🌿', 15, 'common', 50),
]

export const INVENTORY_CAPACITY = 40

export function buildInitialSlots(): InventorySlot[] {
  const slots: InventorySlot[] = Array.from({ length: INVENTORY_CAPACITY }, (_, index) => ({
    index,
    item: null,
  }))
  const positions = [0, 1, 2, 3, 5, 6, 8, 10, 11, 13, 17, 20]
  INITIAL_ITEMS.forEach((it, i) => {
    slots[positions[i]] = { index: positions[i], item: it }
  })
  return slots
}

export const INITIAL_ACTORS: Actor[] = [
  {
    id: 'master-1',
    name: 'Mestre',
    role: 'master',
    avatar: '🧙',
    online: true,
    title: 'Narrador',
    equipped: [],
  },
  {
    id: 'player-aria',
    name: 'Aria',
    role: 'player',
    avatar: '🧝',
    online: true,
    level: 7,
    title: 'Arqueira',
    equipped: [item('bow-aria', 'Arco Longo', '🏹', 1, 'uncommon', 1), item('cloak', 'Manto', '🧥', 1, 'common', 1)],
  },
  {
    id: 'player-brok',
    name: 'Brok',
    role: 'player',
    avatar: '🧔',
    online: true,
    level: 9,
    title: 'Guerreiro',
    equipped: [item('axe-brok', 'Machado Duplo', '🪓', 1, 'rare', 1), item('helm', 'Elmo', '⛑️', 1, 'common', 1)],
  },
  {
    id: 'player-lyra',
    name: 'Lyra',
    role: 'player',
    avatar: '🧚',
    online: false,
    level: 6,
    title: 'Maga',
    equipped: [item('staff', 'Cajado', '🪄', 1, 'epic', 1)],
  },
  {
    id: 'npc-merchant',
    name: 'Gorm',
    role: 'merchant',
    avatar: '🧌',
    online: true,
    title: 'Mercador',
    equipped: [item('scale', 'Balança', '⚖️', 1, 'common', 1)],
  },
]
