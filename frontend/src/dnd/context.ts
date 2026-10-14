import { createContext } from 'react'
import type { DragDropController } from './DragDropController'

export const DragDropContext = createContext<DragDropController | null>(null)
