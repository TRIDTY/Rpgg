import { useState, type FormEvent } from 'react'
import { AVATAR_OPTIONS } from '../domain/character'
import { Modal } from './Modal'

interface Props {
  onCreate: (name: string, avatar: string) => void
  onClose: () => void
}

/** Mestre cria um bot (NPC, mercador, baú…) que aparece na sidebar com mochila controlada por ele. */
export function BotCreationModal({ onCreate, onClose }: Props) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), avatar)
  }

  return (
    <Modal title="🤖 Novo bot" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="screen__subtitle">
          Um personagem sem jogador: você adiciona e retira itens da mochila dele à vontade.
        </p>
        <div className="field">
          <span className="field__label">Avatar</span>
          <div className="avatar-picker" role="radiogroup" aria-label="Avatar do bot">
            {AVATAR_OPTIONS.map((a) => (
              <button
                type="button"
                key={a}
                role="radio"
                aria-checked={avatar === a}
                className={`avatar-picker__option ${avatar === a ? 'is-selected' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span className="field__label">Nome *</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Mercador Olaf, Baú da caverna"
            maxLength={32}
            required
            autoFocus
          />
        </label>
        <div className="btn-row">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
            Criar bot
          </button>
        </div>
      </form>
    </Modal>
  )
}
