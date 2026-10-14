import type { Item } from '../types'
import { useInventoryStore } from '../store/inventoryStore'
import { InventorySlot } from './InventorySlot'
import { IconView } from './IconView'
import './ContainerPanel.css'

interface Props {
  /** Slot da mochila onde está o item de armazenamento aberto. */
  slotIndex: number
  onClose: () => void
  onItemTap?: (item: Item, slotIndex: number, inner?: number) => void
}

/** Conteúdo de um item de armazenamento, lado a lado com a mochila para arrastar itens para dentro/fora. */
export function ContainerPanel({ slotIndex, onClose, onItemTap }: Props) {
  const item = useInventoryStore((s) => s.slots[slotIndex]?.item)
  if (!item?.container) return null
  const used = item.container.filter((s) => s.item !== null).length
  return (
    <section className="container-panel" aria-label={`Conteúdo de ${item.name}`}>
      <header className="container-panel__header">
        <IconView className="container-panel__icon" icon={item.icon} />
        <span className="container-panel__title">{item.name}</span>
        <span className="inventory__capacity">
          {used}/{item.container.length}
        </span>
        <button type="button" className="container-panel__close" onClick={onClose} aria-label="Fechar conteúdo">
          ×
        </button>
      </header>
      <div className="container-panel__scroll">
        <div className="inventory__grid">
          {item.container.map((slot) => (
            <InventorySlot key={slot.index} slot={slot} containerSlot={slotIndex} onItemTap={onItemTap} />
          ))}
        </div>
      </div>
    </section>
  )
}
