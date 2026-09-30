import type { Item } from '../types'
import './ItemTile.css'

interface Props {
  item: Item
}

/** Visual puro de um item dentro de um slot: sprite, nome legível sobreposto e quantidade. */
export function ItemTile({ item }: Props) {
  return (
    <>
      <span className="item-tile__icon">{item.icon}</span>
      {item.quantity > 1 && <span className="item-tile__qty">{item.quantity}</span>}
      <span className="item-tile__name">{item.name}</span>
    </>
  )
}
