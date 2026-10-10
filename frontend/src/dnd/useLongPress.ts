import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { LONG_PRESS_MS } from './DragDropController'

interface Options {
  onLongPress: () => void
  disabled?: boolean
  delayMs?: number
}

const MOVE_TOLERANCE_PX = 8

/**
 * Após um long press o navegador ainda dispara um `click` ao soltar. Se a UI
 * mudou nesse meio tempo (ex.: abriu um modal), esse clique cairia em quem
 * estiver embaixo do dedo. Engolimos o próximo click por um curto período.
 */
function swallowNextClick() {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    stop()
  }
  const stop = () => {
    window.removeEventListener('click', swallow, true)
    window.removeEventListener('pointerdown', stop, true)
    clearTimeout(timer)
  }
  window.addEventListener('click', swallow, true)
  const timer = setTimeout(stop, 700)
  setTimeout(() => window.addEventListener('pointerdown', stop, true), 0)
}

interface Pending {
  pointerId: number
  x: number
  y: number
  timer: ReturnType<typeof setTimeout>
  release: () => void
}

/**
 * Gesto de segurar (long press) para elementos que não são arrastáveis, como
 * slots vazios. Cancela se o dedo se mover (scroll) ou soltar antes do tempo.
 */
export function useLongPress({ onLongPress, disabled, delayMs = LONG_PRESS_MS + 130 }: Options) {
  const [pressing, setPressing] = useState(false)
  const pending = useRef<Pending | null>(null)
  const callback = useRef(onLongPress)

  useEffect(() => {
    callback.current = onLongPress
  }, [onLongPress])

  const cancel = useCallback(() => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    p.release()
    pending.current = null
    setPressing(false)
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return
      cancel()
      const pointerId = event.pointerId
      const start = { x: event.clientX, y: event.clientY }

      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel()
      }
      const onEnd = (e: PointerEvent) => {
        if (e.pointerId === pointerId) cancel()
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)

      pending.current = {
        pointerId,
        ...start,
        release: () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onEnd)
          window.removeEventListener('pointercancel', onEnd)
        },
        timer: setTimeout(() => {
          cancel()
          swallowNextClick()
          callback.current()
        }, delayMs),
      }
      setPressing(true)
    },
    [cancel, delayMs, disabled],
  )

  useEffect(() => cancel, [cancel])

  return useMemo(() => ({ handlers: { onPointerDown }, isPressing: pressing }), [onPointerDown, pressing])
}
