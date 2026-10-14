import { useCallback, useState } from 'react'
import { IconView } from '../components/IconView'
import type { Actor, ActorId, Item, ItemId, NewItemInput, PlayerId, ItemLocation } from '../types'
import { DragDropProvider } from '../dnd/DragDropProvider'
import { DragOverlay } from '../dnd/DragOverlay'
import type { DragPayload, DropTarget } from '../dnd/DragDropController'
import { selectActorById, selectItemById, useInventoryStore } from '../store/inventoryStore'
import { useRoomStore } from '../store/roomStore'
import { useAppStore } from '../store/appStore'
import {
  CreateBot,
  CreateItem,
  DiscardItem,
  InitiateTrade,
  MoveItem,
  RemoveBot,
  SetBotHidden,
  SetInventorySize,
  SetEquipped,
  SetLevel,
  TakeItem,
} from '../services/tradeService'
import { InventoryGrid } from '../components/InventoryGrid'
import { SessionSidebar } from '../components/SessionSidebar'
import { TradeModal } from '../components/TradeModal'
import { PlayerInspectPanel } from '../components/PlayerInspectPanel'
import { ItemCreationModal } from '../components/ItemCreationModal'
import { PeerInventoryModal } from '../components/PeerInventoryModal'
import { ItemDetailsModal } from '../components/ItemDetailsModal'
import { DiscardModal } from '../components/DiscardModal'
import { BotCreationModal } from '../components/BotCreationModal'
import { ContainerPanel } from '../components/ContainerPanel'
import { TrashDropZone } from '../components/TrashDropZone'
import '../App.css'
import './screens.css'

interface PendingTrade {
  itemId: ItemId
  targetPlayerId: ActorId
}

interface PendingDiscard {
  itemId: ItemId
  loc: ItemLocation
}

interface ItemDetails {
  item: Item
  /** Posição na própria mochila: habilita equipar/desequipar (fora de containers) e abrir containers. */
  own?: ItemLocation
  /** Mochila de bot aberta pelo Mestre: habilita pegar/descartar. */
  bot?: { ownerId: PlayerId; loc: ItemLocation }
  /** Item de armazenamento de outro membro (Mestre): habilita abrir o conteúdo. */
  peer?: { ownerId: PlayerId; slotIndex: number }
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
  const leave = useRoomStore((s) => s.leave)
  const navigate = useAppStore((s) => s.navigate)

  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null)
  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscard | null>(null)
  const [inspectingId, setInspectingId] = useState<ActorId | null>(null)
  const [peerInventoryId, setPeerInventoryId] = useState<PlayerId | null>(null)
  const [forgeTarget, setForgeTarget] = useState<ForgeTarget | null>(null)
  const [details, setDetails] = useState<ItemDetails | null>(null)
  const [creatingBot, setCreatingBot] = useState(false)
  const [openContainer, setOpenContainer] = useState<number | null>(null)
  const [peerContainer, setPeerContainer] = useState<number | null>(null)
  const openContainerItem = useInventoryStore((s) => (openContainer === null ? undefined : s.slots[openContainer]?.item))

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

  const handleItemTap = useCallback(
    (item: Item, slotIndex: number, inner?: number) => setDetails({ item, own: { slot: slotIndex, inner } }),
    [],
  )

  const toggleEquip = (item: Item, equipped: boolean) => {
    if (!details) return
    if (details.own) SetEquipped(details.own.slot, item.id, equipped)
    else if (details.bot) SetEquipped(details.bot.loc.slot, item.id, equipped, details.bot.ownerId)
    setDetails(null)
  }

  const openContainerFromDetails = () => {
    if (!details) return
    if (details.own) setOpenContainer(details.own.slot)
    else if (details.bot) setPeerContainer(details.bot.loc.slot)
    else if (details.peer) setPeerContainer(details.peer.slotIndex)
    setDetails(null)
  }

  const forgeItem = (input: NewItemInput) => {
    if (forgeTarget) CreateItem(forgeTarget.ownerId, forgeTarget.slotIndex, input)
    setForgeTarget(null)
  }

  const handleDrop = useCallback(
    (payload: DragPayload, target: DropTarget) => {
      switch (target.kind) {
        case 'slot': {
          const from = { slot: payload.fromSlot, inner: payload.fromInner }
          const to = { slot: target.slotIndex, inner: target.inner }
          moveItem(from, to)
          MoveItem(from, to)
          return
        }
        case 'trash':
          setPendingDiscard({ itemId: payload.itemId, loc: { slot: payload.fromSlot, inner: payload.fromInner } })
          return
        case 'actor':
          if (payload.fromInner !== undefined) {
            useInventoryStore.getState().pushNotice('Tire o item do armazenamento antes de enviar.')
            return
          }
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
      removeItem(pendingDiscard.loc, pendingDiscard.itemId)
      DiscardItem(pendingDiscard.loc, pendingDiscard.itemId)
    }
    setPendingDiscard(null)
  }

  const takeFromBot = ({ ownerId, loc }: NonNullable<ItemDetails['bot']>, item: Item) => {
    TakeItem(ownerId, loc, item.id)
    setDetails(null)
  }

  const discardFromBot = ({ ownerId, loc }: NonNullable<ItemDetails['bot']>, item: Item) => {
    DiscardItem(loc, item.id, ownerId)
    setDetails(null)
  }

  const peerContainerItem = peerContainer !== null ? peerSlots?.[peerContainer]?.item : undefined

  const createBot = (name: string, avatar: string, hidden: boolean) => {
    CreateBot(name, avatar, hidden)
    setCreatingBot(false)
  }

  const removeBot = (actor: Actor) => {
    RemoveBot(actor.id)
    setInspectingId(null)
    setPeerInventoryId(null)
  }

  return (
    <DragDropProvider onDrop={handleDrop}>
      <main className="app app--with-bar">
        <div className="session-bar app__bar">
          <IconView className="session-bar__avatar" icon={self?.avatar ?? ""} />
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
        <div className={`app__inventory ${openContainerItem?.container ? 'app__inventory--split' : ''}`}>
          <InventoryGrid onEmptyLongPress={handleEmptySlotLongPress} onItemTap={handleItemTap} />
          {openContainer !== null && openContainerItem?.container && (
            <ContainerPanel slotIndex={openContainer} onClose={() => setOpenContainer(null)} onItemTap={handleItemTap} />
          )}
        </div>
        <div className="app__sidebar">
          <SessionSidebar
            onTapActor={(a) => setInspectingId(a.id)}
            onAddBot={isGameMaster ? () => setCreatingBot(true) : undefined}
          />
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

      {details && (
        <ItemDetailsModal
          item={details.item}
          onClose={() => setDetails(null)}
          onToggleEquip={
            (details.own && details.own.inner === undefined) || (details.bot && details.bot.loc.inner === undefined)
              ? toggleEquip
              : undefined
          }
          onOpenContainer={details.own || details.bot || details.peer ? openContainerFromDetails : undefined}
          actions={
            details.bot && (
              <>
                <button type="button" className="btn btn--gold" onClick={() => details.bot && takeFromBot(details.bot, details.item)}>
                  🎒 Pegar
                </button>
                <button type="button" className="btn btn--danger" onClick={() => details.bot && discardFromBot(details.bot, details.item)}>
                  🗑️ Descartar
                </button>
              </>
            )
          }
        />
      )}

      {creatingBot && <BotCreationModal onCreate={createBot} onClose={() => setCreatingBot(false)} />}

      {inspecting && (
        <PlayerInspectPanel
          actor={inspecting}
          onClose={() => setInspectingId(null)}
          onRemoveBot={isGameMaster ? removeBot : undefined}
          onSetBotHidden={isGameMaster ? (actor, hidden) => SetBotHidden(actor.id, hidden) : undefined}
          onSetLevel={isGameMaster ? (actor, level) => SetLevel(actor.id, level) : undefined}
          onSetSlots={isGameMaster ? (actor, slots) => SetInventorySize(actor.id, slots) : undefined}
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

      {isGameMaster && peerActor && peerSlots && !forgeTarget && !details && (
        <PeerInventoryModal
          actor={peerActor}
          slots={peerContainerItem?.container ?? peerSlots}
          manageable={peerActor.role === 'bot'}
          containerOf={
            peerContainer !== null && peerContainerItem?.container
              ? { slotIndex: peerContainer, itemName: peerContainerItem.name }
              : undefined
          }
          onClose={() => (peerContainer !== null ? setPeerContainer(null) : setPeerInventoryId(null))}
          onEmptyLongPress={(slotIndex) =>
            setForgeTarget({ ownerId: peerActor.id, ownerName: peerActor.name, slotIndex })
          }
          onItemTap={(item, slotIndex) => {
            const loc: ItemLocation =
              peerContainer !== null && peerContainerItem?.container ? { slot: peerContainer, inner: slotIndex } : { slot: slotIndex }
            setDetails(
              peerActor.role === 'bot'
                ? { item, bot: { ownerId: peerActor.id, loc } }
                : { item, peer: { ownerId: peerActor.id, slotIndex: loc.slot } },
            )
          }}
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
