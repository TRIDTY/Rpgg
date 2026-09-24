import { useCallback, useEffect, useState } from 'react'
import type { Actor, ActorId, ItemId } from './types'
import { DragDropProvider } from './dnd/DragDropProvider'
import { DragOverlay } from './dnd/DragOverlay'
import type { DragPayload, DropTarget } from './dnd/DragDropController'
import { selectActorById, selectItemById, useInventoryStore } from './store/inventoryStore'
import { realtimeClient } from './services/websocket'
import { InitiateTrade, MoveItem } from './services/tradeService'
import { InventoryGrid } from './components/InventoryGrid'
import { SessionSidebar } from './components/SessionSidebar'
import { TradeModal } from './components/TradeModal'
import { PlayerInspectPanel } from './components/PlayerInspectPanel'
import './App.css'

interface PendingTrade {
  itemId: ItemId
  targetPlayerId: ActorId
}

export default function App() {
  const moveItem = useInventoryStore((s) => s.moveItem)
  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null)
  const [inspecting, setInspecting] = useState<Actor | null>(null)

  useEffect(() => realtimeClient.connect(), [])

  const handleDrop = useCallback(
    (payload: DragPayload, target: DropTarget) => {
      if (target.kind === 'slot') {
        moveItem(payload.fromSlot, target.slotIndex)
        MoveItem(payload.fromSlot, target.slotIndex)
        return
      }
      setPendingTrade({ itemId: payload.itemId, targetPlayerId: target.actorId })
    },
    [moveItem],
  )

  const tradeItem = useInventoryStore(pendingTrade ? selectItemById(pendingTrade.itemId) : () => undefined)
  const tradeTarget = useInventoryStore(
    pendingTrade ? selectActorById(pendingTrade.targetPlayerId) : () => undefined,
  )

  const confirmTrade = () => {
    if (pendingTrade) InitiateTrade(pendingTrade.itemId, pendingTrade.targetPlayerId)
    setPendingTrade(null)
  }

  return (
    <DragDropProvider onDrop={handleDrop}>
      <main className="app">
        <div className="app__inventory">
          <InventoryGrid />
        </div>
        <div className="app__sidebar">
          <SessionSidebar onTapActor={setInspecting} />
        </div>
      </main>

      <DragOverlay />

      {pendingTrade && tradeItem && tradeTarget && (
        <TradeModal
          item={tradeItem}
          target={tradeTarget}
          onConfirm={confirmTrade}
          onCancel={() => setPendingTrade(null)}
        />
      )}

      {inspecting && <PlayerInspectPanel actor={inspecting} onClose={() => setInspecting(null)} />}
    </DragDropProvider>
  )
}
