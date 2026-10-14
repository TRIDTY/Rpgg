import { useState } from 'react'
import { IconView } from './IconView'
import type { Actor } from '../types'
import { MAX_INVENTORY_SLOTS, MAX_LEVEL, MIN_LEVEL } from '../types'
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
  /** Ferramenta do Mestre: oculta/revela o bot para os jogadores. */
  onSetBotHidden?: (actor: Actor, hidden: boolean) => void
  /** Ferramenta do Mestre: limita/amplia a mochila de jogadores e bots. */
  onSetSlots?: (actor: Actor, slots: number) => void
}

const ROLE_LABEL: Record<Actor['role'], string> = {
  player: 'Jogador',
  master: 'Mestre da Sessão',
  merchant: 'NPC Mercador',
  bot: 'Bot do Mestre',
}

export function PlayerInspectPanel({ actor, onClose, onOpenInventory, onSetLevel, onRemoveBot, onSetBotHidden, onSetSlots }: Props) {
  const canSeeEquipment = actor.role !== 'master'

  return (
    <Modal title={actor.name} onClose={onClose} variant="sheet">
      <div className="inspect">
        <div className="inspect__hero">
          <IconView className={`inspect__avatar inspect__avatar--${actor.role}`} icon={actor.avatar} />
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
          <NumberEditor
            key={`level-${actor.level}`}
            label="Nível (Mestre)"
            name="Nível"
            value={actor.level}
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            onChange={(level) => onSetLevel(actor, level)}
          />
        )}
        {onSetSlots && actor.role !== 'master' && actor.slots !== undefined && (
          <NumberEditor
            key={`slots-${actor.slots}`}
            label="Slots da mochila (Mestre)"
            name="Slots da mochila"
            value={actor.slots}
            min={1}
            max={MAX_INVENTORY_SLOTS}
            onChange={(slots) => onSetSlots(actor, slots)}
          />
        )}

        <h3 className="inspect__section">Equipado</h3>
        {canSeeEquipment ? (
          actor.equipped.length > 0 ? (
            <ul className="inspect__equipped">
              {actor.equipped.map((item) => (
                <li key={item.id} className={`inspect__equip inspect__equip--${item.rarity}`}>
                  <IconView className="inspect__equip-icon" icon={item.icon} />
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

        {actor.role === 'bot' && onSetBotHidden && (
          <div className="inspect__visibility">
            <p className="inspect__empty">
              {actor.hidden ? '🙈 Oculto: os jogadores não veem este bot.' : '👁️ Visível para todos os jogadores.'}
            </p>
            <button type="button" className="btn" onClick={() => onSetBotHidden(actor, !actor.hidden)}>
              {actor.hidden ? '👁️ Mostrar aos jogadores' : '🙈 Ocultar dos jogadores'}
            </button>
          </div>
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

interface NumberEditorProps {
  label: string
  name: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** Controle do Mestre: −/+ aplicam na hora; o campo numérico aplica ao sair/Enter. */
function NumberEditor({ label, name, value, min, max, onChange }: NumberEditorProps) {
  const [draft, setDraft] = useState(String(value))
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.trunc(v)))

  const commit = (v: number) => {
    if (!Number.isFinite(v)) {
      setDraft(String(value))
      return
    }
    const next = clamp(v)
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className="level-editor" role="group" aria-label={name}>
      <span className="inspect__section level-editor__label">{label}</span>
      <div className="level-editor__controls">
        <button type="button" className="level-editor__step" onClick={() => commit(value - 1)} disabled={value <= min} aria-label={`Diminuir ${name}`}>
          −
        </button>
        <input
          className="level-editor__input"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(Number(draft))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          aria-label={name}
        />
        <button type="button" className="level-editor__step" onClick={() => commit(value + 1)} disabled={value >= max} aria-label={`Aumentar ${name}`}>
          +
        </button>
      </div>
    </div>
  )
}
