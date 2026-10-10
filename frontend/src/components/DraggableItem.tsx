import type { Item } from '../types'
import { useDraggable } from '../dnd/hooks'
import { ItemTile } from './ItemTile'
import './DraggableItem.css'

interface Props {
  item: Item
  slotIndex: number
  /** Toque curto no item (leitura). Segurar continua iniciando o arrasto. */
  onTap?: (item: Item, slotIndex: number) => void
}

export function DraggableItem({ item, slotIndex, onTap }: Props) {
  const { handlers, isPressing, isDragging } = useDraggable({
    id: `slot-${slotIndex}`,
    onTap: onTap ? () => onTap(item, slotIndex) : undefined,
    payload: {
      kind: 'item',
      itemId: item.id,
      fromSlot: slotIndex,
      icon: item.icon,
      name: item.name,
      quantity: item.quantity,
    },
  })

  const className = [
    'draggable-item',
    'item-tile',
    `item-tile--${item.rarity}`,
    isPressing && 'draggable-item--pressing',
    isDragging && 'draggable-item--dragging',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      title={item.description ? `${item.name} — ${item.description}` : item.name}
      role="button"
      aria-label={`${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`}
      {...handlers}
    >
      <ItemTile item={item} />
      <span className="draggable-item__press-ring" />
    </div>
  )
}
