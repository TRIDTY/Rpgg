import { useAppStore } from '../store/appStore'
import { useRoomStore } from '../store/roomStore'
import './screens.css'

export function HomeScreen() {
  const characters = useAppStore((s) => s.characters)
  const active = useAppStore((s) => s.activeCharacter)
  const navigate = useAppStore((s) => s.navigate)
  const selectCharacter = useAppStore((s) => s.selectCharacter)
  const deleteCharacter = useAppStore((s) => s.deleteCharacter)
  const error = useRoomStore((s) => s.error)
  const clearError = useRoomStore((s) => s.clearError)

  return (
    <div className="screen home">
      <div>
        <div className="home__logo">🎒</div>
        <h1 className="home__title">Inventário RPG</h1>
        <p className="screen__subtitle">Sua mesa, seu celular, sua rede Wi-Fi. Sem nuvem.</p>
      </div>

      {error && (
        <div className="error-banner" onClick={clearError} role="alert">
          {error}
        </div>
      )}

      <div className="home__actions">
        <button type="button" className="action-card action-card--host" onClick={() => navigate('host-room')}>
          <span className="action-card__icon">🏰</span>
          <span>
            <span className="action-card__title">Criar uma Sala</span>
            <span className="action-card__desc">
              Vira o Mestre: seu aparelho abre o servidor local e guarda o estado da sessão.
            </span>
          </span>
        </button>

        <button
          type="button"
          className="action-card action-card--player"
          onClick={() => navigate('create-character')}
        >
          <span className="action-card__icon">🧝</span>
          <span>
            <span className="action-card__title">Criar Perfil de Personagem</span>
            <span className="action-card__desc">Gera a ficha JSON (save game) guardada só neste aparelho.</span>
          </span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn--ghost home__join"
        disabled={!active}
        onClick={() => navigate('join-room')}
        title={active ? undefined : 'Crie um personagem primeiro'}
      >
        🔑 Entrar em uma Sala
      </button>

      {characters.length > 0 && (
        <div className="character-list">
          <span className="character-list__label">Fichas neste aparelho</span>
          {characters.map((c) => (
            <button
              type="button"
              key={c.PlayerId}
              className={`character-chip ${active?.PlayerId === c.PlayerId ? 'is-active' : ''}`}
              onClick={() => selectCharacter(c.PlayerId)}
              onDoubleClick={() => {
                if (confirm(`Apagar a ficha de ${c.Name}?`)) void deleteCharacter(c.PlayerId)
              }}
            >
              <span className="character-chip__avatar">{c.Avatar}</span>
              <span>
                <span className="character-chip__name">{c.Name}</span>
                <br />
                <span className="character-chip__meta">
                  {c.Role === 'GM' ? 'Mestre' : c.Title || 'Aventureiro'} · Nível {c.Level} ·{' '}
                  {c.Inventory.filter((s) => s.item).length} itens
                </span>
              </span>
              {active?.PlayerId === c.PlayerId && <span className="character-chip__badge">ativo</span>}
            </button>
          ))}
          <span className="home__footer">Toque para selecionar · toque duplo para apagar</span>
        </div>
      )}
    </div>
  )
}
