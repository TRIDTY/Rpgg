import { memo, useCallback, useEffect, useState } from 'react'
import type { InventorySlot as InventorySlotModel, Item } from '../types'
import { useDropTarget } from '../dnd/hooks'
import { useLongPress } from '../dnd/useLongPress'
import { DraggableItem } from './DraggableItem'
import './InventorySlot.css'

interface Props {
  slot: InventorySlotModel
  /**
   * Long press em slot vazio. Retorna `true` se a ação foi permitida; `false`
   * faz o slot piscar (feedback neutro para quem não tem permissão).
   */
  onEmptyLongPress?: (slotIndex: number) => boolean
  /** Toque curto em slot ocupado (inspecionar o item). */
  onItemTap?: (item: Item, slotIndex: number) => void
}

export const InventorySlot = memo(function InventorySlot({ slot, onEmptyLongPress, onItemTap }: Props) {
  const { isOver, isDragActive, attributes } = useDropTarget({
    id: `slot-${slot.index}`,
    kind: 'slot',
    slotIndex: slot.index,
  })
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!denied) return
    const t = setTimeout(() => setDenied(false), 500)
    return () => clearTimeout(t)
  }, [denied])

  const handleLongPress = useCallback(() => {
    if (!onEmptyLongPress) return
    if (!onEmptyLongPress(slot.index)) setDenied(true)
  }, [onEmptyLongPress, slot.index])

  const { handlers, isPressing } = useLongPress({
    onLongPress: handleLongPress,
    disabled: !!slot.item || !onEmptyLongPress,
  })

  const className = [
    'inventory-slot',
    slot.item ? 'inventory-slot--filled' : 'inventory-slot--empty',
    isDragActive && !slot.item && 'inventory-slot--available',
    isOver && 'inventory-slot--over',
    isPressing && 'inventory-slot--pressing',
    denied && 'inventory-slot--denied',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} {...attributes} {...handlers} data-slot-index={slot.index}>
      {slot.item ? (
        <DraggableItem item={slot.item} slotIndex={slot.index} onTap={onItemTap} />
      ) : (
        <span className="inventory-slot__index">{slot.index + 1}</span>
      )}
    </div>
  )
})
