import type { Actor, Item } from '../types'
import { Modal } from './Modal'
import './TradeModal.css'

interface Props {
  item: Item
  target: Actor
  onConfirm: () => void
  onCancel: () => void
}

export function TradeModal({ item, target, onConfirm, onCancel }: Props) {
  const isMerchant = target.role === 'merchant'
  return (
    <Modal title={isMerchant ? 'Iniciar negociação' : 'Enviar item'} onClose={onCancel}>
      <div className="trade">
        <div className="trade__item">
          <span className={`trade__icon trade__icon--${item.rarity}`}>{item.icon}</span>
          <span className="trade__label">
            {item.name}
            {item.quantity > 1 && <small> x{item.quantity}</small>}
          </span>
        </div>
        <span className="trade__arrow">➜</span>
        <div className="trade__target">
          <span className="trade__avatar">{target.avatar}</span>
          <span className="trade__label">{target.name}</span>
        </div>
      </div>
      <p className="trade__question">
        {isMerchant ? (
          <>
            Deseja abrir uma <strong>TradeSession</strong> com <strong>{target.name}</strong> oferecendo{' '}
            <strong>{item.name}</strong>?
          </>
        ) : (
          <>
            Deseja enviar <strong>{item.name}</strong> para <strong>{target.name}</strong>?
          </>
        )}
      </p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className={`btn ${isMerchant ? 'btn--gold' : 'btn--primary'}`} onClick={onConfirm}>
          {isMerchant ? 'Negociar' : 'Enviar'}
        </button>
      </div>
    </Modal>
  )
}
