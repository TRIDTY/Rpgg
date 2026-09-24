import { useEffect, useState, type FormEvent } from 'react'
import { parseInvite } from '../room/invite'
import { LOOPBACK_HOST } from '../room/transport'
import { useAppStore } from '../store/appStore'
import { useRoomStore } from '../store/roomStore'
import './screens.css'

export function JoinRoomScreen() {
  const navigate = useAppStore((s) => s.navigate)
  const active = useAppStore((s) => s.activeCharacter)
  const lastRoomAddress = useAppStore((s) => s.lastRoomAddress)
  const rememberRoomAddress = useAppStore((s) => s.rememberRoomAddress)
  const joinRoom = useRoomStore((s) => s.joinRoom)
  const mode = useRoomStore((s) => s.mode)
  const error = useRoomStore((s) => s.error)
  const clearError = useRoomStore((s) => s.clearError)

  const [address, setAddress] = useState(lastRoomAddress)
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (mode === 'joined') navigate('session')
  }, [mode, navigate])

  useEffect(() => () => clearError(), [clearError])

  const onAddressChange = (value: string) => {
    setInvalid(false)
    const parsed = parseInvite(value)
    if (value.trim().startsWith('rpgg://') && parsed?.address) {
      setAddress(`${parsed.address.host}:${parsed.address.port}`)
      if (parsed.password) setPassword(parsed.password)
      return
    }
    setAddress(value)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!active) return
    const parsed = parseInvite(address)
    if (!parsed?.address) {
      setInvalid(true)
      return
    }
    await rememberRoomAddress(address.trim())
    await joinRoom(active, parsed.address, password.trim().toUpperCase())
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={() => navigate('home')} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Entrar em uma Sala</h1>
          <p className="screen__subtitle">Sua ficha local é enviada ao Mestre no handshake.</p>
        </div>
      </header>

      {active && (
        <div className="character-chip is-active" style={{ cursor: 'default' }}>
          <span className="character-chip__avatar">{active.Avatar}</span>
          <span>
            <span className="character-chip__name">{active.Name}</span>
            <br />
            <span className="character-chip__meta">
              {active.Title || 'Aventureiro'} · Nível {active.Level}
            </span>
          </span>
          <span className="character-chip__badge">ficha</span>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field__label">Endereço do Host (IP:porta) ou link de convite</span>
          <input
            className="input input--mono"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder={`192.168.0.10:8765  ·  ${LOOPBACK_HOST}`}
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
          {invalid && <span className="error-banner">Endereço inválido</span>}
        </label>

        <label className="field">
          <span className="field__label">Senha da sala</span>
          <input
            className="input input--mono"
            value={password}
            onChange={(e) => setPassword(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={12}
            autoCapitalize="characters"
            required
          />
        </label>

        <button type="submit" className="btn btn--primary btn--block" disabled={!active || mode === 'connecting'}>
          {mode === 'connecting' ? 'Conectando…' : '🔑 Conectar'}
        </button>
      </form>

      <p className="home__footer">
        Testando no navegador? Abra a sala em outra aba e use o endereço <strong>{LOOPBACK_HOST}</strong>.
      </p>
    </div>
  )
}
