import { useCallback, useState } from 'react'
import type { Actor, ActorId, ItemId } from '../types'
import { DragDropProvider } from '../dnd/DragDropProvider'
import { DragOverlay } from '../dnd/DragOverlay'
import type { DragPayload, DropTarget } from '../dnd/DragDropController'
import { LOOT_TABLE } from '../data/mockData'
import { selectActorById, selectItemById, useInventoryStore } from '../store/inventoryStore'
import { useRoomStore } from '../store/roomStore'
import { useAppStore } from '../store/appStore'
import { InitiateTrade, MoveItem } from '../services/tradeService'
import { InventoryGrid } from '../components/InventoryGrid'
import { SessionSidebar } from '../components/SessionSidebar'
import { TradeModal } from '../components/TradeModal'
import { PlayerInspectPanel } from '../components/PlayerInspectPanel'
import '../App.css'
import './screens.css'

interface PendingTrade {
  itemId: ItemId
  targetPlayerId: ActorId
}

export function SessionScreen() {
  const moveItem = useInventoryStore((s) => s.moveItem)
  const roomName = useInventoryStore((s) => s.roomName)
  const self = useInventoryStore((s) => s.self)
  const notices = useInventoryStore((s) => s.notices)
  const mode = useRoomStore((s) => s.mode)
  const giveItem = useRoomStore((s) => s.giveItem)
  const leave = useRoomStore((s) => s.leave)
  const navigate = useAppStore((s) => s.navigate)

  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null)
  const [inspectingId, setInspectingId] = useState<ActorId | null>(null)

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
  const inspecting = useInventoryStore(inspectingId ? selectActorById(inspectingId) : () => undefined)

  const confirmTrade = () => {
    if (pendingTrade) InitiateTrade(pendingTrade.itemId, pendingTrade.targetPlayerId)
    setPendingTrade(null)
  }

  const giveLoot = (actor: Actor) => {
    const loot = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)]
    giveItem(actor.id, loot)
  }

  const isHost = mode === 'hosting'

  return (
    <DragDropProvider onDrop={handleDrop}>
      <main className="app app--with-bar">
        <div className="session-bar app__bar">
          <span className="session-bar__avatar">{self?.avatar}</span>
          <span className="session-bar__text">
            <span className="session-bar__name">
              {self?.name} {isHost && <small>· Mestre</small>}
            </span>
            <span className="session-bar__room">🏰 {roomName}</span>
          </span>
          {isHost ? (
            <button type="button" className="session-bar__leave" onClick={() => navigate('host-room')}>
              Convite
            </button>
          ) : (
            <button
              type="button"
              className="session-bar__leave"
              onClick={() => void leave().then(() => navigate('home'))}
            >
              Sair
            </button>
          )}
        </div>
        <div className="app__inventory">
          <InventoryGrid />
        </div>
        <div className="app__sidebar">
          <SessionSidebar onTapActor={(a) => setInspectingId(a.id)} />
        </div>
      </main>

      <DragOverlay />

      {notices.length > 0 && (
        <div className="notices" aria-live="polite">
          {notices.map((n) => (
            <div className="notice" key={n.id}>
              {n.text}
            </div>
          ))}
        </div>
      )}

      {pendingTrade && tradeItem && tradeTarget && (
        <TradeModal
          item={tradeItem}
          target={tradeTarget}
          onConfirm={confirmTrade}
          onCancel={() => setPendingTrade(null)}
        />
      )}

      {inspecting && (
        <PlayerInspectPanel
          actor={inspecting}
          onClose={() => setInspectingId(null)}
          onGiveLoot={isHost ? giveLoot : undefined}
        />
      )}
    </DragDropProvider>
  )
}
