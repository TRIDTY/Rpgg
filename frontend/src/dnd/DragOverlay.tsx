import { useEffect, useRef } from 'react'
import { useDragDropController, useDragState } from './hooks'
import './DragOverlay.css'

export function DragOverlay() {
  const controller = useDragDropController()
  const drag = useDragState()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!drag) return
    return controller.subscribePoint(({ x, y }) => {
      const el = ref.current
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    })
  }, [controller, drag])

  if (!drag) return null
  const { payload, overTargetId } = drag
  const target = overTargetId ? controller.getTarget(overTargetId) : undefined
  const { x, y } = controller.getLastPoint()

  return (
    <div
      ref={ref}
      className={`drag-overlay ${target ? `drag-overlay--over-${target.kind}` : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)` }}
      aria-hidden
    >
      <span className="drag-overlay__icon">{payload.icon}</span>
      {payload.quantity > 1 && <span className="drag-overlay__qty">{payload.quantity}</span>}
    </div>
  )
}
