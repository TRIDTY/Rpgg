import { memo } from 'react'
import type { InventorySlot as InventorySlotModel } from '../types'
import { useDropTarget } from '../dnd/hooks'
import { DraggableItem } from './DraggableItem'
import './InventorySlot.css'

interface Props {
  slot: InventorySlotModel
}

export const InventorySlot = memo(function InventorySlot({ slot }: Props) {
  const { isOver, isDragActive, attributes } = useDropTarget({
    id: `slot-${slot.index}`,
    kind: 'slot',
    slotIndex: slot.index,
  })

  const className = [
    'inventory-slot',
    slot.item ? 'inventory-slot--filled' : 'inventory-slot--empty',
    isDragActive && !slot.item && 'inventory-slot--available',
    isOver && 'inventory-slot--over',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} {...attributes} data-slot-index={slot.index}>
      {slot.item ? (
        <DraggableItem item={slot.item} slotIndex={slot.index} />
      ) : (
        <span className="inventory-slot__index">{slot.index + 1}</span>
      )}
    </div>
  )
})
