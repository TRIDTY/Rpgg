import { useInventoryStore } from '../store/inventoryStore'
import { InventorySlot } from './InventorySlot'
import './InventoryGrid.css'

export function InventoryGrid() {
  const slots = useInventoryStore((s) => s.slots)
  const capacity = useInventoryStore((s) => s.capacity)
  const used = slots.filter((s) => s.item !== null).length

  return (
    <section className="inventory" aria-label="Inventário">
      <header className="inventory__header">
        <h1 className="inventory__title">
          <span className="inventory__title-icon">🎒</span> Mochila
        </h1>
        <span className="inventory__capacity">
          {used}/{capacity}
        </span>
      </header>
      <div className="inventory__scroll">
        <div className="inventory__grid">
          {slots.map((slot) => (
            <InventorySlot key={slot.index} slot={slot} />
          ))}
        </div>
      </div>
    </section>
  )
}
