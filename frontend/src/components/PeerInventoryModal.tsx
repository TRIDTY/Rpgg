import type { Actor, InventorySlot, Item } from '../types'
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
  /** Toque curto em um item (índice do slot incluso para pegar/descartar). */
  onItemTap?: (item: Item, slotIndex: number) => void
  /** Mochila de bot: o Mestre pega e descarta itens livremente. */
  manageable?: boolean
}

/** Visão do Mestre sobre a mochila de um jogador conectado (somente leitura + forja em slots vazios). */
export function PeerInventoryModal({ actor, slots, onClose, onEmptyLongPress, onItemTap, manageable }: Props) {
  const used = slots.filter((s) => s.item !== null).length
  return (
    <Modal title={`🎒 Mochila de ${actor.name}`} onClose={onClose} variant="sheet">
      <p className="peer-inv__hint">
        {used}/{slots.length} slots · toque em um item para {manageable ? 'pegar ou descartar' : 'ler'} · segure um slot
        vazio para forjar
      </p>
      <div className="peer-inv__grid">
        {slots.map((slot) => (
          <PeerSlot
            key={slot.index}
            slot={slot}
            onLongPress={() => onEmptyLongPress(slot.index)}
            onTap={onItemTap && ((item) => onItemTap(item, slot.index))}
          />
        ))}
      </div>
    </Modal>
  )
}

function PeerSlot({
  slot,
  onLongPress,
  onTap,
}: {
  slot: InventorySlot
  onLongPress: () => void
  onTap?: (item: Item) => void
}) {
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
        <button
          type="button"
          className={`item-tile item-tile--${slot.item.rarity} peer-inv__item`}
          title={slot.item.name}
          onClick={() => slot.item && onTap?.(slot.item)}
        >
          <ItemTile item={slot.item} />
        </button>
      ) : (
        <span className="inventory-slot__index">{slot.index + 1}</span>
      )}
    </div>
  )
}
