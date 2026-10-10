import { useCallback, useState } from 'react'
import type { Actor, ActorId, Item, ItemId, NewItemInput, PlayerId } from '../types'
import { DragDropProvider } from '../dnd/DragDropProvider'
import { DragOverlay } from '../dnd/DragOverlay'
import type { DragPayload, DropTarget } from '../dnd/DragDropController'
import { LOOT_TABLE } from '../data/mockData'
import { selectActorById, selectItemById, useInventoryStore } from '../store/inventoryStore'
import { useRoomStore } from '../store/roomStore'
import { useAppStore } from '../store/appStore'
import { CreateItem, DiscardItem, InitiateTrade, MoveItem, SetLevel } from '../services/tradeService'
import { InventoryGrid } from '../components/InventoryGrid'
import { SessionSidebar } from '../components/SessionSidebar'
import { TradeModal } from '../components/TradeModal'
import { PlayerInspectPanel } from '../components/PlayerInspectPanel'
import { ItemCreationModal } from '../components/ItemCreationModal'
import { PeerInventoryModal } from '../components/PeerInventoryModal'
import { ItemDetailsModal } from '../components/ItemDetailsModal'
import { DiscardModal } from '../components/DiscardModal'
import { TrashDropZone } from '../components/TrashDropZone'
import '../App.css'
import './screens.css'

interface PendingTrade {
  itemId: ItemId
  targetPlayerId: ActorId
}

interface PendingDiscard {
  itemId: ItemId
  slotIndex: number
}

interface ForgeTarget {
  ownerId: PlayerId
  ownerName: string
  slotIndex: number
}

export function SessionScreen() {
  const moveItem = useInventoryStore((s) => s.moveItem)
  const removeItem = useInventoryStore((s) => s.removeItem)
  const roomName = useInventoryStore((s) => s.roomName)
  const self = useInventoryStore((s) => s.self)
  const notices = useInventoryStore((s) => s.notices)
  const mode = useRoomStore((s) => s.mode)
  const inventories = useRoomStore((s) => s.inventories)
  const giveItem = useRoomStore((s) => s.giveItem)
  const leave = useRoomStore((s) => s.leave)
  const navigate = useAppStore((s) => s.navigate)

  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null)
  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscard | null>(null)
  const [inspectingId, setInspectingId] = useState<ActorId | null>(null)
  const [peerInventoryId, setPeerInventoryId] = useState<PlayerId | null>(null)
  const [forgeTarget, setForgeTarget] = useState<ForgeTarget | null>(null)
  const [detailsItem, setDetailsItem] = useState<Item | null>(null)

  const isGameMaster = self?.role === 'master'
  const isHost = mode === 'hosting'

  const handleEmptySlotLongPress = useCallback(
    (slotIndex: number) => {
      if (!isGameMaster || !self) return false
      setForgeTarget({ ownerId: self.id, ownerName: self.name, slotIndex })
      return true
    },
    [isGameMaster, self],
  )

  const handleItemTap = useCallback((item: Item) => setDetailsItem(item), [])

  const forgeItem = (input: NewItemInput) => {
    if (forgeTarget) CreateItem(forgeTarget.ownerId, forgeTarget.slotIndex, input)
    setForgeTarget(null)
  }

  const handleDrop = useCallback(
    (payload: DragPayload, target: DropTarget) => {
      switch (target.kind) {
        case 'slot':
          moveItem(payload.fromSlot, target.slotIndex)
          MoveItem(payload.fromSlot, target.slotIndex)
          return
        case 'trash':
          setPendingDiscard({ itemId: payload.itemId, slotIndex: payload.fromSlot })
          return
        case 'actor':
          setPendingTrade({ itemId: payload.itemId, targetPlayerId: target.actorId })
      }
    },
    [moveItem],
  )

  const tradeItem = useInventoryStore(pendingTrade ? selectItemById(pendingTrade.itemId) : () => undefined)
  const tradeTarget = useInventoryStore(
    pendingTrade ? selectActorById(pendingTrade.targetPlayerId) : () => undefined,
  )
  const discardItem = useInventoryStore(pendingDiscard ? selectItemById(pendingDiscard.itemId) : () => undefined)
  const inspecting = useInventoryStore(inspectingId ? selectActorById(inspectingId) : () => undefined)
  const peerActor = useInventoryStore(peerInventoryId ? selectActorById(peerInventoryId) : () => undefined)
  const peerSlots = peerInventoryId ? inventories[peerInventoryId] : undefined

  const confirmTrade = () => {
    if (pendingTrade) InitiateTrade(pendingTrade.itemId, pendingTrade.targetPlayerId)
    setPendingTrade(null)
  }

  const confirmDiscard = () => {
    if (pendingDiscard) {
      removeItem(pendingDiscard.slotIndex, pendingDiscard.itemId)
      DiscardItem(pendingDiscard.slotIndex, pendingDiscard.itemId)
    }
    setPendingDiscard(null)
  }

  const giveLoot = (actor: Actor) => {
    const loot = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)]
    giveItem(actor.id, loot)
  }

  return (
    <DragDropProvider onDrop={handleDrop}>
      <main className="app app--with-bar">
        <div className="session-bar app__bar">
          <span className="session-bar__avatar">{self?.avatar}</span>
          <span className="session-bar__text">
            <span className="session-bar__name">
              {self?.name} <small>· {isGameMaster ? 'Mestre' : 'Jogador'}</small>
              {isHost && <small className="session-bar__tag">Host</small>}
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
          <InventoryGrid onEmptyLongPress={handleEmptySlotLongPress} onItemTap={handleItemTap} />
        </div>
        <div className="app__sidebar">
          <SessionSidebar onTapActor={(a) => setInspectingId(a.id)} />
        </div>
      </main>

      <TrashDropZone />
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

      {pendingDiscard && discardItem && (
        <DiscardModal item={discardItem} onConfirm={confirmDiscard} onCancel={() => setPendingDiscard(null)} />
      )}

      {detailsItem && <ItemDetailsModal item={detailsItem} onClose={() => setDetailsItem(null)} />}

      {inspecting && (
        <PlayerInspectPanel
          actor={inspecting}
          onClose={() => setInspectingId(null)}
          onGiveLoot={isGameMaster ? giveLoot : undefined}
          onSetLevel={isGameMaster ? (actor, level) => SetLevel(actor.id, level) : undefined}
          onOpenInventory={
            isGameMaster
              ? (actor) => {
                  setInspectingId(null)
                  setPeerInventoryId(actor.id)
                }
              : undefined
          }
        />
      )}

      {isGameMaster && peerActor && peerSlots && !forgeTarget && !detailsItem && (
        <PeerInventoryModal
          actor={peerActor}
          slots={peerSlots}
          onClose={() => setPeerInventoryId(null)}
          onEmptyLongPress={(slotIndex) =>
            setForgeTarget({ ownerId: peerActor.id, ownerName: peerActor.name, slotIndex })
          }
          onItemTap={handleItemTap}
        />
      )}

      {forgeTarget && (
        <ItemCreationModal
          ownerName={forgeTarget.ownerName}
          slotIndex={forgeTarget.slotIndex}
          onForge={forgeItem}
          onClose={() => setForgeTarget(null)}
        />
      )}
    </DragDropProvider>
  )
}
