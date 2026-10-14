import type { Item } from '../types'
import { IconView } from './IconView'
import './ItemTile.css'

interface Props {
  item: Item
}

/** Visual puro de um item dentro de um slot: sprite, nome legível sobreposto e quantidade. */
export function ItemTile({ item }: Props) {
  return (
    <>
      <IconView className="item-tile__icon" icon={item.icon} />
      {item.quantity > 1 && <span className="item-tile__qty">{item.quantity}</span>}
      <span className="item-tile__name">{item.name}</span>
      {item.equipped && (
        <span className="item-tile__equipped" title="Equipado" aria-label="Equipado">
          ⚔
        </span>
      )}
    </>
  )
}
