import type { Actor, InventorySlot } from '../types'
import { useLongPress } from '../dnd/useLongPress'
import { Modal } from './Modal'
import { ItemTile } from './ItemTile'
import './PeerInventoryModal.css'

interface Props {
  actor: Actor
  slots: InventorySlot[]
  onClose: () => void
  /** Mestre: long press em slot vazio para forjar um item direto na mochila do jogador. */
  onEmptyLongPress: (slotIndex: number) => void
}

/** Visão do Mestre sobre a mochila de um jogador conectado (somente leitura + forja em slots vazios). */
export function PeerInventoryModal({ actor, slots, onClose, onEmptyLongPress }: Props) {
  const used = slots.filter((s) => s.item !== null).length
  return (
    <Modal title={`🎒 Mochila de ${actor.name}`} onClose={onClose} variant="sheet">
      <p className="peer-inv__hint">
        {used}/{slots.length} slots · segure um slot vazio para forjar um item aqui
      </p>
      <div className="peer-inv__grid">
        {slots.map((slot) => (
          <PeerSlot key={slot.index} slot={slot} onLongPress={() => onEmptyLongPress(slot.index)} />
        ))}
      </div>
    </Modal>
  )
}

function PeerSlot({ slot, onLongPress }: { slot: InventorySlot; onLongPress: () => void }) {
  const { handlers, isPressing } = useLongPress({ onLongPress, disabled: !!slot.item })
  const className = [
    'inventory-slot',
    slot.item ? 'inventory-slot--filled' : 'inventory-slot--empty',
    isPressing && 'inventory-slot--pressing',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={className} {...handlers} data-slot-index={slot.index}>
      {slot.item ? (
        <div className={`item-tile item-tile--${slot.item.rarity}`} title={slot.item.name}>
          <ItemTile item={slot.item} />
        </div>
      ) : (
        <span className="inventory-slot__index">{slot.index + 1}</span>
      )}
    </div>
  )
}
