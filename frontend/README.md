# Inventário RPG — Frontend

Interface gamificada (mobile-first) do gerenciador de inventário. React 19 + Vite + TypeScript + Zustand.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm run build      # tsc -b && vite build
```

Requer Node `^20.19 || >=22.12`.

Sem `VITE_WS_URL` o app roda com um cliente mock que emite `InventoryUpdatedEvent` periodicamente.
Para conectar ao backend real:

```bash
VITE_WS_URL=ws://localhost:8080/ws npm run dev
```

## Estrutura

```
src/
  types.ts                 # Item, InventorySlot, Actor, eventos WS e comandos
  store/inventoryStore.ts  # Zustand: slots, atores, moveItem, applyInventoryUpdated
  services/websocket.ts    # RealtimeClient (WebSocket real ou mock) -> despacha eventos no store
  services/tradeService.ts # InitiateTrade(itemId, targetPlayerId) / MoveItem(from, to)
  dnd/
    DragDropController.ts  # Gesto (long press -> drag -> drop) + hit-test de alvos registrados
    DragDropProvider.tsx   # Contexto React
    hooks.ts               # useDraggable / useDropTarget / useDragState
    DragOverlay.tsx        # "Fantasma" do item que segue o dedo
  components/
    InventoryGrid / InventorySlot / DraggableItem
    SessionSidebar / PlayerAvatarBubble
    TradeModal / PlayerInspectPanel / Modal
```

## Gestos

- **Segurar (220ms) + arrastar** um item para outro slot: move (ou troca / empilha se for o mesmo item).
- **Arrastar até uma bolinha**: a bolinha brilha e cresce; ao soltar abre o modal "Deseja enviar [Item] para [Jogador]?".
  Confirmar dispara `InitiateTrade(itemId, targetPlayerId)` (console + comando pelo canal realtime).
- **Tap na bolinha**: abre painel com informações públicas e itens equipados.
- Swipe rápido sem segurar continua rolando a grade normalmente.
