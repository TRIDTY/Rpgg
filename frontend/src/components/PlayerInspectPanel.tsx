import { useState } from 'react'
import type { Actor } from '../types'
import { MAX_LEVEL, MIN_LEVEL } from '../types'
import { Modal } from './Modal'
import './PlayerInspectPanel.css'

interface Props {
  actor: Actor
  onClose: () => void
  /** Ferramenta do Mestre: abre a mochila do jogador para editar/forjar itens. */
  onOpenInventory?: (actor: Actor) => void
  /** Ferramenta do Mestre: define o Nível da ficha do ator (validado e propagado pelo Host). */
  onSetLevel?: (actor: Actor, level: number) => void
  /** Ferramenta do Mestre: apaga um bot da sala (com a mochila dele). */
  onRemoveBot?: (actor: Actor) => void
}

const ROLE_LABEL: Record<Actor['role'], string> = {
  player: 'Jogador',
  master: 'Mestre da Sessão',
  merchant: 'NPC Mercador',
  bot: 'Bot do Mestre',
}

export function PlayerInspectPanel({ actor, onClose, onOpenInventory, onSetLevel, onRemoveBot }: Props) {
  const canSeeEquipment = actor.role !== 'master'

  return (
    <Modal title={actor.name} onClose={onClose} variant="sheet">
      <div className="inspect">
        <div className="inspect__hero">
          <span className={`inspect__avatar inspect__avatar--${actor.role}`}>{actor.avatar}</span>
          <div className="inspect__meta">
            <span className="inspect__role">{ROLE_LABEL[actor.role]}</span>
            {actor.title && <span className="inspect__title">{actor.title}</span>}
            {actor.level !== undefined && !onSetLevel && <span className="inspect__level">Nível {actor.level}</span>}
            <span className={`inspect__status ${actor.online ? 'is-online' : ''}`}>
              {actor.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {onSetLevel && actor.level !== undefined && (
          <LevelEditor key={actor.level} level={actor.level} onChange={(level) => onSetLevel(actor, level)} />
        )}

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

        {(actor.role === 'player' || actor.role === 'bot') && onOpenInventory && (
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => onOpenInventory(actor)}>
              🎒 Abrir mochila
            </button>
            {actor.role === 'bot' && onRemoveBot && (
              <button type="button" className="btn btn--danger" onClick={() => onRemoveBot(actor)}>
                🗑️ Remover bot
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

const clampLevel = (value: number) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(value)))

/** Controle do Mestre: −/+ aplicam na hora; o campo numérico aplica ao sair/Enter. */
function LevelEditor({ level, onChange }: { level: number; onChange: (level: number) => void }) {
  const [draft, setDraft] = useState(String(level))

  const commit = (value: number) => {
    if (!Number.isFinite(value)) {
      setDraft(String(level))
      return
    }
    const next = clampLevel(value)
    setDraft(String(next))
    if (next !== level) onChange(next)
  }

  return (
    <div className="level-editor" role="group" aria-label="Nível do personagem">
      <span className="inspect__section level-editor__label">Nível (Mestre)</span>
      <div className="level-editor__controls">
        <button
          type="button"
          className="level-editor__step"
          onClick={() => commit(level - 1)}
          disabled={level <= MIN_LEVEL}
          aria-label="Diminuir nível"
        >
          −
        </button>
        <input
          className="level-editor__input"
          type="number"
          inputMode="numeric"
          min={MIN_LEVEL}
          max={MAX_LEVEL}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(Number(draft))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label="Nível"
        />
        <button
          type="button"
          className="level-editor__step"
          onClick={() => commit(level + 1)}
          disabled={level >= MAX_LEVEL}
          aria-label="Aumentar nível"
        >
          +
        </button>
      </div>
    </div>
  )
}
