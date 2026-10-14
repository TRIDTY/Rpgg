import type { ReactNode } from 'react'
import { IconView } from './IconView'
import type { Item } from '../types'
import { Modal } from './Modal'
import './ItemDetailsModal.css'

interface Props {
  item: Item
  onClose: () => void
  /** Botões extras (ex.: Mestre pegando/descartando um item de bot). */
  actions?: ReactNode
  /** Dono da mochila (ou Mestre em bot): equipa/desequipa o item. */
  onToggleEquip?: (item: Item, equipped: boolean) => void
  /** Item de armazenamento: abre o conteúdo. */
  onOpenContainer?: (item: Item) => void
}

const RARITY_LABEL: Record<Item['rarity'], string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

/** Inspeção de item (toque curto em slot ocupado): imagem em destaque, nome e descrição. */
export function ItemDetailsModal({ item, onClose, actions, onToggleEquip, onOpenContainer }: Props) {
  const stored = item.container?.filter((s) => s.item !== null).length ?? 0
  return (
    <Modal title="Item" onClose={onClose}>
      <div className="item-details">
        <span className={`item-details__icon item-details__icon--${item.rarity}`} aria-hidden>
          <IconView icon={item.icon} />
        </span>
        <h3 className="item-details__name">{item.name}</h3>
        <p className="item-details__meta">
          <span className={`item-details__rarity item-details__rarity--${item.rarity}`}>{RARITY_LABEL[item.rarity]}</span>
          {item.equipped && <span className="item-details__equipped">⚔ Equipado</span>}
          {item.container && (
            <span className="item-details__qty">
              📦 {stored} <small>/ {item.container.length} slots</small>
            </span>
          )}
          {item.maxStack > 1 && (
            <span className="item-details__qty">
              x{item.quantity} <small>/ {item.maxStack}</small>
            </span>
          )}
        </p>
        <p className={`item-details__description ${item.description ? '' : 'is-empty'}`}>
          {item.description?.trim() || 'Sem descrição. O Mestre ainda não escreveu nada sobre este item.'}
        </p>
        {item.image && <img className="item-details__image" src={item.image} alt={`Imagem de ${item.name}`} draggable={false} />}
      </div>
      <div className="btn-row">
        {item.container && onOpenContainer && (
          <button type="button" className="btn btn--gold" onClick={() => onOpenContainer(item)}>
            📦 Abrir
          </button>
        )}
        {onToggleEquip && (
          <button
            type="button"
            className={`btn ${item.equipped ? '' : 'btn--gold'}`}
            onClick={() => onToggleEquip(item, !item.equipped)}
          >
            {item.equipped ? '⚔ Desequipar' : '⚔ Equipar'}
          </button>
        )}
        {actions}
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
