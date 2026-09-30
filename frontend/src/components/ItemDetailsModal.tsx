import type { Item } from '../types'
import { Modal } from './Modal'
import './ItemDetailsModal.css'

interface Props {
  item: Item
  onClose: () => void
}

const RARITY_LABEL: Record<Item['rarity'], string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

/** Inspeção de item (toque curto em slot ocupado): imagem em destaque, nome e descrição. */
export function ItemDetailsModal({ item, onClose }: Props) {
  return (
    <Modal title="Item" onClose={onClose}>
      <div className="item-details">
        <span className={`item-details__icon item-details__icon--${item.rarity}`} aria-hidden>
          {item.icon}
        </span>
        <h3 className="item-details__name">{item.name}</h3>
        <p className="item-details__meta">
          <span className={`item-details__rarity item-details__rarity--${item.rarity}`}>{RARITY_LABEL[item.rarity]}</span>
          {item.maxStack > 1 && (
            <span className="item-details__qty">
              x{item.quantity} <small>/ {item.maxStack}</small>
            </span>
          )}
        </p>
        <p className={`item-details__description ${item.description ? '' : 'is-empty'}`}>
          {item.description?.trim() || 'Sem descrição. O Mestre ainda não escreveu nada sobre este item.'}
        </p>
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
