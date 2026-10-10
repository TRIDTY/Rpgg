import { useDropTarget } from '../dnd/hooks'
import './TrashDropZone.css'

export const TRASH_TARGET_ID = 'trash'

/**
 * Lixeira flutuante (FAB) fora da grade. Fica em destaque assim que um arrasto
 * começa e cresce quando o item passa por cima; soltar aqui descarta o item.
 */
export function TrashDropZone() {
  const { isOver, isDragActive, attributes } = useDropTarget({ id: TRASH_TARGET_ID, kind: 'trash' })
  const className = ['trash-fab', isDragActive && 'trash-fab--armed', isOver && 'trash-fab--over']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} {...attributes} role="img" aria-label="Lixeira: solte um item aqui para descartar">
      <span className="trash-fab__icon">🗑️</span>
      <span className="trash-fab__label">{isOver ? 'Soltar para descartar' : 'Descartar'}</span>
    </div>
  )
}
