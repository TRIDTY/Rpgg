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

## App Android (APK)

APK debug pronto para instalar: [`demo/inventario-demo.apk`](../demo/inventario-demo.apk) (baixe no celular, abra o
arquivo e aceite "instalar de fonte desconhecida"). Nele, **Criar Nova Sala** sobe um servidor WebSocket de verdade na
Wi-Fi do aparelho (plugin nativo `RoomServer`, Java-WebSocket) e mostra o IP real; outros celulares com o app entram
pelo IP:porta ou QR. As fichas ficam em arquivos JSON no armazenamento do app (Capacitor Filesystem).

Para gerar o APK (Node 22, JDK 21 e Android SDK com `platforms;android-36` + `build-tools;36.0.0`; `ANDROID_HOME`
apontando para o SDK ou `android/local.properties` com `sdk.dir=`):

```bash
npm run build:apk   # build web + cap sync + gradle assembleDebug → ../demo/inventario-demo.apk
```

Projeto nativo em `android/` (Capacitor 8). Plugin do servidor: `android/app/src/main/java/com/tridev/rpgg/RoomServerPlugin.java`,
contrato TypeScript em `src/room/nativeRoomServer.ts`.

## Demo para celular (arquivo único, sem instalar)

`npm run build:demo` gera `../demo/inventario-demo.html`, um HTML autocontido (JS + CSS embutidos, sala loopback no
mesmo navegador). Basta baixar o arquivo no celular e abrir com o Chrome (Android) — não precisa de servidor.

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

## Fluxo de telas (lobby)

```
Home ──► Criar Nova Sala (Host) ──► Sala aberta (IP/senha/QR, sem ficha) ──┐
     └─► Conectar a uma Sala (Join) ──► conexão aceita pelo Host ───────────┤
                                                                             ▼
                                                Escolher perfil (fichas JSON locais / Criar Novo Perfil)
                                                                             ▼
                                                                          Sessão
```

A camada de rede (`roomStore.startHosting` / `connectToRoom`) não conhece a ficha; `joinAs(profile)` faz o handshake
depois. A Role vem da ficha (`Player` ou `GM`): o Host pode jogar como Player e um cliente pode ser o Mestre —
o `HostSession` autoriza ações de Mestre por `profile.Role`, não por quem hospeda.

## Gestos

- **Toque curto** em um item: abre o `ItemDetailsModal` (imagem, nome, descrição, raridade/quantidade).
- **Segurar (220ms) + arrastar** um item para outro slot: move; se o destino tiver item com o **mesmo Nome e Descrição**
  as pilhas se fundem (até `maxStack`, o excedente fica na origem); se forem diferentes, os slots trocam de lugar.
- **Arrastar até a Lixeira** (FAB no canto, acende durante o arrasto): confirma "Deseja mesmo descartar [Nome]?" e envia
  `DiscardItem(slotIndex, itemId)` ao Host, que valida, remove e devolve `InventoryUpdatedEvent`.
- **Segurar um slot vazio**: só o Mestre (`Role === 'GM'`) abre a forja de itens; Player vê o slot piscar.
- **Arrastar até uma bolinha**: a bolinha brilha e cresce; ao soltar abre o modal "Deseja enviar [Item] para [Jogador]?".
  Confirmar dispara `InitiateTrade(itemId, targetPlayerId)` (console + comando pelo canal realtime).
- **Tap na bolinha**: abre painel com informações públicas e itens equipados.
- Swipe rápido sem segurar continua rolando a grade normalmente.
