import type { ActorId, ItemId } from '../types'

export interface ItemDragPayload {
  kind: 'item'
  itemId: ItemId
  fromSlot: number
  icon: string
  name: string
  quantity: number
}

export type DragPayload = ItemDragPayload

export type DropTarget =
  | { id: string; kind: 'slot'; slotIndex: number }
  | { id: string; kind: 'actor'; actorId: ActorId }

export interface DragState {
  payload: DragPayload
  sourceId: string
  overTargetId: string | null
  origin: { x: number; y: number }
}

export interface Point {
  x: number
  y: number
}

export interface DragDropCallbacks {
  onDrop: (payload: DragPayload, target: DropTarget) => void
  onDragStart?: (payload: DragPayload) => void
  onDragCancel?: (payload: DragPayload) => void
}

interface PendingPress {
  pointerId: number
  payload: DragPayload
  sourceId: string
  start: Point
  timer: ReturnType<typeof setTimeout>
  onStateChange: (phase: PressPhase) => void
}

export type PressPhase = 'idle' | 'pressing' | 'dragging'

export const LONG_PRESS_MS = 220
const MOVE_TOLERANCE_PX = 8
const DROP_ID_ATTR = 'data-drop-id'

type Listener = () => void
type PointListener = (point: Point) => void

/**
 * Centraliza toda a lógica de gesto (long press -> arrastar -> soltar) e a detecção
 * de intersecção com alvos registrados. Os componentes visuais apenas se conectam via hooks.
 */
export class DragDropController {
  private targets = new Map<string, DropTarget>()
  private state: DragState | null = null
  private pending: PendingPress | null = null
  private activePhaseListener: ((phase: PressPhase) => void) | null = null
  private listeners = new Set<Listener>()
  private pointListeners = new Set<PointListener>()
  private lastPoint: Point = { x: 0, y: 0 }
  private callbacks: DragDropCallbacks

  constructor(callbacks: DragDropCallbacks) {
    this.callbacks = callbacks
  }

  setCallbacks(callbacks: DragDropCallbacks) {
    this.callbacks = callbacks
  }

  // ----- store API (para useSyncExternalStore) -----
  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribePoint = (listener: PointListener) => {
    this.pointListeners.add(listener)
    listener(this.lastPoint)
    return () => {
      this.pointListeners.delete(listener)
    }
  }

  getSnapshot = (): DragState | null => this.state

  getLastPoint = (): Point => this.lastPoint

  private emit() {
    for (const l of this.listeners) l()
  }

  // ----- alvos -----
  registerTarget(target: DropTarget) {
    this.targets.set(target.id, target)
    return () => {
      this.targets.delete(target.id)
    }
  }

  getTarget(id: string) {
    return this.targets.get(id)
  }

  // ----- gesto -----
  beginPress(
    event: PointerEvent,
    payload: DragPayload,
    sourceId: string,
    onStateChange: (phase: PressPhase) => void,
  ) {
    if (this.state || this.pending) return
    if (event.button !== 0) return

    const start = { x: event.clientX, y: event.clientY }
    this.lastPoint = start

    const timer = setTimeout(() => this.startDrag(), LONG_PRESS_MS)
    this.pending = { pointerId: event.pointerId, payload, sourceId, start, timer, onStateChange }
    onStateChange('pressing')

    window.addEventListener('pointermove', this.handlePointerMove, { passive: false })
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerCancel)
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    window.addEventListener('contextmenu', this.preventDefault)
  }

  private startDrag() {
    const pending = this.pending
    if (!pending) return
    this.pending = null
    this.activePhaseListener = pending.onStateChange

    this.state = {
      payload: pending.payload,
      sourceId: pending.sourceId,
      overTargetId: null,
      origin: pending.start,
    }
    pending.onStateChange('dragging')
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(15)
    this.callbacks.onDragStart?.(pending.payload)
    this.emit()
    this.updateOver(this.lastPoint)
  }

  private handlePointerMove = (event: PointerEvent) => {
    const point = { x: event.clientX, y: event.clientY }
    this.lastPoint = point

    if (this.pending) {
      const dx = point.x - this.pending.start.x
      const dy = point.y - this.pending.start.y
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) this.cancelPress()
      return
    }

    if (!this.state) return
    if (event.cancelable) event.preventDefault()
    for (const l of this.pointListeners) l(point)
    this.updateOver(point)
  }

  private handleTouchMove = (event: TouchEvent) => {
    if (this.state && event.cancelable) event.preventDefault()
  }

  private preventDefault = (event: Event) => {
    if (this.state || this.pending) event.preventDefault()
  }

  private updateOver(point: Point) {
    if (!this.state) return
    const overId = this.hitTest(point)
    if (overId !== this.state.overTargetId) {
      this.state = { ...this.state, overTargetId: overId }
      this.emit()
    }
  }

  private hitTest(point: Point): string | null {
    const stack = document.elementsFromPoint(point.x, point.y)
    for (const el of stack) {
      const host = (el as HTMLElement).closest?.(`[${DROP_ID_ATTR}]`) as HTMLElement | null
      if (!host) continue
      const id = host.getAttribute(DROP_ID_ATTR)
      if (id && this.targets.has(id) && id !== this.state?.sourceId) return id
    }
    return null
  }

  private handlePointerUp = () => {
    if (this.pending) {
      this.cancelPress()
      return
    }
    if (!this.state) return

    const { payload, overTargetId } = this.state
    const target = overTargetId ? this.targets.get(overTargetId) : undefined
    this.finish()
    if (target) this.callbacks.onDrop(payload, target)
    else this.callbacks.onDragCancel?.(payload)
  }

  private handlePointerCancel = () => {
    if (this.pending) {
      this.cancelPress()
      return
    }
    if (!this.state) return
    const { payload } = this.state
    this.finish()
    this.callbacks.onDragCancel?.(payload)
  }

  private cancelPress() {
    if (!this.pending) return
    clearTimeout(this.pending.timer)
    this.pending.onStateChange('idle')
    this.pending = null
    this.removeWindowListeners()
  }

  private finish() {
    this.activePhaseListener?.('idle')
    this.activePhaseListener = null
    this.state = null
    this.removeWindowListeners()
    this.emit()
  }

  private removeWindowListeners() {
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerCancel)
    window.removeEventListener('touchmove', this.handleTouchMove)
    window.removeEventListener('contextmenu', this.preventDefault)
  }

  destroy() {
    if (this.pending) clearTimeout(this.pending.timer)
    this.pending = null
    this.state = null
    this.removeWindowListeners()
  }
}

export { DROP_ID_ATTR }
