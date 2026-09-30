import { useState } from 'react'
import type { CharacterProfile, PlayerId } from '../types'
import { useAppStore } from '../store/appStore'
import { useRoomStore } from '../store/roomStore'
import './screens.css'

/**
 * Passo "Jogo" do lobby: a rede já está pronta (sala aberta neste aparelho ou
 * conexão aceita pelo Host). Aqui o usuário escolhe com qual ficha local entra —
 * a Role (Player/GM) vem da própria ficha, não de quem hospeda.
 */
export function ProfileSelectScreen() {
  const characters = useAppStore((s) => s.characters)
  const navigate = useAppStore((s) => s.navigate)
  const createCharacter = useAppStore((s) => s.createCharacter)
  const selectCharacter = useAppStore((s) => s.selectCharacter)
  const deleteCharacter = useAppStore((s) => s.deleteCharacter)
  const mode = useRoomStore((s) => s.mode)
  const room = useRoomStore((s) => s.room)
  const error = useRoomStore((s) => s.error)
  const joinAs = useRoomStore((s) => s.joinAs)
  const leave = useRoomStore((s) => s.leave)

  const [joining, setJoining] = useState<PlayerId | null>(null)
  const isHost = mode === 'hosting'

  const enter = async (profile: CharacterProfile) => {
    if (joining) return
    setJoining(profile.PlayerId)
    const ok = await joinAs(profile)
    setJoining(null)
    if (ok) {
      await selectCharacter(profile.PlayerId)
      navigate('session')
    }
  }

  const back = () => {
    if (isHost) {
      navigate('host-room')
      return
    }
    void leave().then(() => navigate('join-room'))
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={back} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Escolha seu perfil</h1>
          <p className="screen__subtitle">
            {isHost ? 'Sala aberta' : 'Conectado'} em <strong>{room?.name || `${room?.host}:${room?.port}`}</strong>.
            Com qual ficha você entra?
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="character-list">
        {characters.length === 0 && (
          <div className="member-list__empty">Nenhuma ficha salva neste aparelho ainda. Crie a primeira abaixo.</div>
        )}
        {characters.map((c) => (
          <button
            type="button"
            key={c.PlayerId}
            className={`character-chip ${joining === c.PlayerId ? 'is-active' : ''}`}
            disabled={joining !== null}
            onClick={() => void enter(c)}
            onDoubleClick={() => {
              if (confirm(`Apagar a ficha de ${c.Name}?`)) void deleteCharacter(c.PlayerId)
            }}
          >
            <span className="character-chip__avatar">{c.Avatar}</span>
            <span>
              <span className="character-chip__name">{c.Name}</span>
              <br />
              <span className="character-chip__meta">
                {c.Title || (c.Role === 'GM' ? 'Narrador' : 'Aventureiro')} · Nível {c.Level} ·{' '}
                {c.Inventory.filter((s) => s.item).length} itens
              </span>
            </span>
            <span className={`role-badge ${c.Role === 'GM' ? 'role-badge--gm' : ''}`}>
              {joining === c.PlayerId ? 'entrando…' : c.Role === 'GM' ? '🧙 GM' : '🗡️ Player'}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => createCharacter('select-profile')}
        disabled={joining !== null}
      >
        ✨ Criar Novo Perfil
      </button>

      <p className="home__footer">
        Toque em uma ficha para entrar · toque duplo para apagar. A Role (Jogador ou Mestre) é a da ficha — o Host da rede
        não precisa ser o Mestre.
      </p>
    </div>
  )
}
