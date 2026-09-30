import { useAppStore } from '../store/appStore'
import { useRoomStore } from '../store/roomStore'
import './screens.css'

export function HomeScreen() {
  const characters = useAppStore((s) => s.characters)
  const navigate = useAppStore((s) => s.navigate)
  const createCharacter = useAppStore((s) => s.createCharacter)
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
            <span className="action-card__title">Criar Nova Sala (Host)</span>
            <span className="action-card__desc">
              Seu aparelho abre o servidor local. Depois você escolhe com qual ficha entrar — Jogador ou Mestre.
            </span>
          </span>
        </button>

        <button type="button" className="action-card action-card--player" onClick={() => navigate('join-room')}>
          <span className="action-card__icon">🔑</span>
          <span>
            <span className="action-card__title">Conectar a uma Sala (Join)</span>
            <span className="action-card__desc">Use o IP/código do Host na mesma rede e escolha sua ficha em seguida.</span>
          </span>
        </button>
      </div>

      <button type="button" className="btn btn--ghost home__join" onClick={() => createCharacter('home')}>
        🧝 Criar Perfil de Personagem
      </button>

      {characters.length > 0 && (
        <div className="character-list">
          <span className="character-list__label">Fichas neste aparelho ({characters.length})</span>
          {characters.map((c) => (
            <div
              key={c.PlayerId}
              className="character-chip"
              style={{ cursor: 'default' }}
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
              <span className={`role-badge ${c.Role === 'GM' ? 'role-badge--gm' : ''}`}>
                {c.Role === 'GM' ? '🧙 GM' : '🗡️ Player'}
              </span>
            </div>
          ))}
          <span className="home__footer">A ficha é escolhida ao entrar em uma sala · toque duplo para apagar</span>
        </div>
      )}
    </div>
  )
}
