import type { Actor } from '../types'
import { useInventoryStore } from '../store/inventoryStore'
import { PlayerAvatarBubble } from './PlayerAvatarBubble'
import './SessionSidebar.css'

interface Props {
  onTapActor: (actor: Actor) => void
}

export function SessionSidebar({ onTapActor }: Props) {
  const actors = useInventoryStore((s) => s.actors)
  const connected = useInventoryStore((s) => s.connected)

  return (
    <aside className="session-sidebar" aria-label="Membros da sessão">
      <div className={`session-sidebar__conn ${connected ? 'is-on' : ''}`} title={connected ? 'Conectado' : 'Desconectado'}>
        <span className="session-sidebar__conn-dot" />
        <span className="session-sidebar__conn-label">{connected ? 'Ao vivo' : 'Offline'}</span>
      </div>
      <div className="session-sidebar__list">
        {actors.map((actor) => (
          <PlayerAvatarBubble key={actor.id} actor={actor} onTap={onTapActor} />
        ))}
      </div>
    </aside>
  )
}
