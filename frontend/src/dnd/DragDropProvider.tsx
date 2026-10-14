import { useEffect, useState, type ReactNode } from 'react'
import { DragDropController, type DragDropCallbacks } from './DragDropController'
import { DragDropContext } from './context'

interface ProviderProps extends DragDropCallbacks {
  children: ReactNode
}

export function DragDropProvider({ children, onDrop, onDragStart, onDragCancel }: ProviderProps) {
  const [controller] = useState(() => new DragDropController({ onDrop, onDragStart, onDragCancel }))

  useEffect(() => {
    controller.setCallbacks({ onDrop, onDragStart, onDragCancel })
  }, [controller, onDrop, onDragStart, onDragCancel])

  useEffect(() => () => controller.destroy(), [controller])

  return <DragDropContext.Provider value={controller}>{children}</DragDropContext.Provider>
}
