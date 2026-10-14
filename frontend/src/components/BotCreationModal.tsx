import { useState, type FormEvent } from 'react'
import { AvatarPicker } from './AvatarPicker'
import { Modal } from './Modal'

interface Props {
  onCreate: (name: string, avatar: string, hidden: boolean) => void
  onClose: () => void
}

/** Mestre cria um bot (NPC, mercador, baú…) que aparece na sidebar com mochila controlada por ele. */
export function BotCreationModal({ onCreate, onClose }: Props) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [hidden, setHidden] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), avatar, hidden)
  }

  return (
    <Modal title="🤖 Novo bot" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="screen__subtitle">
          Um personagem sem jogador: você adiciona e retira itens da mochila dele à vontade.
        </p>
        <div className="field">
          <span className="field__label">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} ariaLabel="Avatar do bot" />
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
        <label className="checkbox">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          <span>🙈 Oculto para os jogadores (você pode revelar depois)</span>
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
