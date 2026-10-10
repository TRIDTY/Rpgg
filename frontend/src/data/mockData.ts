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

