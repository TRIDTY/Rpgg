import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import './Modal.css'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  variant?: 'center' | 'sheet'
}

export function Modal({ title, onClose, children, variant = 'center' }: Props) {
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fecha só quando o gesto começou E terminou no backdrop; evita fechar por um
  // clique "herdado" de um long press que abriu este modal.
  const onBackdropPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pressedBackdrop.current = e.target === e.currentTarget
  }
  const onBackdropClick = () => {
    if (pressedBackdrop.current) onClose()
    pressedBackdrop.current = false
  }

  return (
    <div className="modal-backdrop" onPointerDown={onBackdropPointerDown} onClick={onBackdropClick}>
      <div
        className={`modal modal--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
