import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  DROP_ID_ATTR,
  type DragDropController,
  type DragPayload,
  type DragState,
  type DropTarget,
  type PressPhase,
} from './DragDropController'
import { DragDropContext } from './context'

export function useDragDropController(): DragDropController {
  const controller = useContext(DragDropContext)
  if (!controller) throw new Error('useDragDropController deve ser usado dentro de <DragDropProvider>')
  return controller
}

export function useDragState(): DragState | null {
  const controller = useDragDropController()
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => null)
}

interface UseDraggableOptions {
  id: string
  payload: DragPayload | null
  disabled?: boolean
}

export function useDraggable({ id, payload, disabled }: UseDraggableOptions) {
  const controller = useDragDropController()
  const [phase, setPhase] = useState<PressPhase>('idle')
  const payloadRef = useRef(payload)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || !payloadRef.current) return
      controller.beginPress(event.nativeEvent, payloadRef.current, id, setPhase)
    },
    [controller, disabled, id],
  )

  return useMemo(
    () => ({
      handlers: { onPointerDown },
      isPressing: phase === 'pressing',
      isDragging: phase === 'dragging',
    }),
    [onPointerDown, phase],
  )
}

export function useDropTarget(target: DropTarget) {
  const controller = useDragDropController()
  const { id } = target
  const targetKey = JSON.stringify(target)

  useEffect(
    () => controller.registerTarget(JSON.parse(targetKey) as DropTarget),
    [controller, targetKey],
  )

  const isOver = useSyncExternalStore(
    controller.subscribe,
    () => controller.getSnapshot()?.overTargetId === id,
    () => false,
  )
  const isDragActive = useSyncExternalStore(
    controller.subscribe,
    () => controller.getSnapshot() !== null,
    () => false,
  )

  return useMemo(
    () => ({ isOver, isDragActive, attributes: { [DROP_ID_ATTR]: id } }),
    [isOver, isDragActive, id],
  )
}
