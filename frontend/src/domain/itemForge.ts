import type { Item, ItemRarity, NewItemInput } from '../types'
import { newId } from './character'

/** Galeria de sprites padrão do ItemCreationModal. */
export const ITEM_SPRITES: { icon: string; label: string }[] = [
  { icon: '🗡️', label: 'Espada' },
  { icon: '🛡️', label: 'Escudo' },
  { icon: '🏹', label: 'Arco' },
  { icon: '🪓', label: 'Machado' },
  { icon: '🔱', label: 'Tridente' },
  { icon: '🧪', label: 'Poção' },
  { icon: '⚗️', label: 'Elixir' },
  { icon: '📜', label: 'Pergaminho' },
  { icon: '📖', label: 'Grimório' },
  { icon: '🪙', label: 'Moeda' },
  { icon: '💰', label: 'Saco de ouro' },
  { icon: '💎', label: 'Gema' },
  { icon: '💍', label: 'Anel' },
  { icon: '📿', label: 'Amuleto' },
  { icon: '🗝️', label: 'Chave' },
  { icon: '🧭', label: 'Bússola' },
  { icon: '🕯️', label: 'Vela' },
  { icon: '🍖', label: 'Comida' },
  { icon: '🌿', label: 'Erva' },
  { icon: '🦴', label: 'Osso' },
]

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

export const RARITIES = Object.keys(RARITY_LABEL) as ItemRarity[]

/** Instancia a entidade Item com um UUID novo a partir do formulário do Mestre. */
export function forgeItem(input: NewItemInput): Item {
  const quantity = Math.max(1, Math.floor(input.quantity) || 1)
  const maxStack = Math.max(quantity, Math.floor(input.maxStack) || 1)
  return {
    id: newId(),
    name: input.name.trim(),
    icon: input.icon,
    description: input.description?.trim() || undefined,
    rarity: input.rarity,
    quantity,
    maxStack,
  }
}

export function isValidItemInput(input: NewItemInput): boolean {
  return input.name.trim().length > 0 && input.icon.length > 0 && RARITIES.includes(input.rarity)
}
