import type { Item } from '../types'
import { useDraggable } from '../dnd/hooks'
import './DraggableItem.css'

interface Props {
  item: Item
  slotIndex: number
}

export function DraggableItem({ item, slotIndex }: Props) {
  const { handlers, isPressing, isDragging } = useDraggable({
    id: `slot-${slotIndex}`,
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
    `draggable-item--${item.rarity}`,
    isPressing && 'draggable-item--pressing',
    isDragging && 'draggable-item--dragging',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      title={item.name}
      role="button"
      aria-label={`${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`}
      {...handlers}
    >
      <span className="draggable-item__icon">{item.icon}</span>
      {item.quantity > 1 && <span className="draggable-item__qty">{item.quantity}</span>}
      <span className="draggable-item__press-ring" />
    </div>
  )
}
