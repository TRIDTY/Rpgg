import type { Actor } from '../types'
import { Modal } from './Modal'
import './PlayerInspectPanel.css'

interface Props {
  actor: Actor
  onClose: () => void
}

const ROLE_LABEL: Record<Actor['role'], string> = {
  player: 'Jogador',
  master: 'Mestre da Sessão',
  merchant: 'NPC Mercador',
}

export function PlayerInspectPanel({ actor, onClose }: Props) {
  const canSeeEquipment = actor.role !== 'master'

  return (
    <Modal title={actor.name} onClose={onClose} variant="sheet">
      <div className="inspect">
        <div className="inspect__hero">
          <span className={`inspect__avatar inspect__avatar--${actor.role}`}>{actor.avatar}</span>
          <div className="inspect__meta">
            <span className="inspect__role">{ROLE_LABEL[actor.role]}</span>
            {actor.title && <span className="inspect__title">{actor.title}</span>}
            {actor.level !== undefined && <span className="inspect__level">Nível {actor.level}</span>}
            <span className={`inspect__status ${actor.online ? 'is-online' : ''}`}>
              {actor.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <h3 className="inspect__section">Equipado</h3>
        {canSeeEquipment ? (
          actor.equipped.length > 0 ? (
            <ul className="inspect__equipped">
              {actor.equipped.map((item) => (
                <li key={item.id} className={`inspect__equip inspect__equip--${item.rarity}`}>
                  <span className="inspect__equip-icon">{item.icon}</span>
                  <span className="inspect__equip-name">{item.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="inspect__empty">Nada equipado.</p>
          )
        ) : (
          <p className="inspect__empty">O Mestre não expõe equipamentos.</p>
        )}
      </div>
    </Modal>
  )
}
