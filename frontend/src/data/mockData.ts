import type { Item } from '../types'

export const INVENTORY_CAPACITY = 40

export const item = (
  id: string,
  name: string,
  icon: string,
  quantity: number,
  rarity: Item['rarity'],
  maxStack = 99,
  description?: string,
): Item => ({ id, name, icon, quantity, maxStack, rarity, description })

/** Itens iniciais opcionais de um personagem novo. */
export const STARTER_KIT: Item[] = [
  item('sword-iron', 'Espada de Ferro', '🗡️', 1, 'common', 1, 'Uma lâmina simples, mas confiável.'),
  item('potion-hp', 'Poção de Vida', '🧪', 3, 'uncommon', 20, 'Restaura 50 PV.'),
  item('gold', 'Moedas de Ouro', '🪙', 25, 'common', 999),
  item('bread', 'Pão', '🍞', 4, 'common', 30),
  item('torch', 'Tocha', '🔥', 2, 'common', 20),
]

/** Catálogo que o Mestre pode distribuir como loot. */
export const LOOT_TABLE: Item[] = [
  item('gold', 'Moedas de Ouro', '🪙', 10, 'common', 999),
  item('potion-hp', 'Poção de Vida', '🧪', 1, 'uncommon', 20, 'Restaura 50 PV.'),
  item('arrow', 'Flechas', '➶', 10, 'common', 50),
  item('shield-oak', 'Escudo de Carvalho', '🛡️', 1, 'common', 1),
  item('bow-elven', 'Arco Élfico', '🏹', 1, 'rare', 1, 'Leve e silencioso.'),
  item('scroll-fire', 'Pergaminho de Fogo', '📜', 1, 'epic', 10, 'Conjura Bola de Fogo.'),
  item('gem-ruby', 'Rubi', '💎', 1, 'rare', 50),
  item('key-old', 'Chave Antiga', '🗝️', 1, 'uncommon', 1),
  item('ring-void', 'Anel do Vazio', '💍', 1, 'legendary', 1, 'Sussurra segredos esquecidos.'),
  item('herb', 'Erva Curativa', '🌿', 5, 'common', 50),
]
