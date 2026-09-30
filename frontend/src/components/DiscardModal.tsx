import type { Item } from '../types'
import { Modal } from './Modal'
import './DiscardModal.css'

interface Props {
  item: Item
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmação rápida antes de destruir um item solto na lixeira. */
export function DiscardModal({ item, onConfirm, onCancel }: Props) {
  return (
    <Modal title="Descartar item" onClose={onCancel}>
      <div className="discard">
        <span className={`discard__icon discard__icon--${item.rarity}`}>{item.icon}</span>
        <span className="discard__trash">🗑️</span>
      </div>
      <p className="discard__question">
        Deseja mesmo descartar <strong>{item.name}</strong>
        {item.quantity > 1 && (
          <>
            {' '}
            <strong>x{item.quantity}</strong>
          </>
        )}
        ? Essa ação não pode ser desfeita.
      </p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn discard__confirm" onClick={onConfirm}>
          Descartar
        </button>
      </div>
    </Modal>
  )
}
