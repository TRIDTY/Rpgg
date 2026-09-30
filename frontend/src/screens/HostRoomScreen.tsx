import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { encodeInvite, generateRoomPassword } from '../room/invite'
import { DEFAULT_ROOM_PORT, formatAddress, LOOPBACK_HOST } from '../room/transport'
import { useAppStore } from '../store/appStore'
import { membersOf, useRoomStore } from '../store/roomStore'
import './screens.css'

export function HostRoomScreen() {
  const mode = useRoomStore((s) => s.mode)
  return mode === 'hosting' ? <HostLobby /> : <HostSetup />
}

function HostSetup() {
  const navigate = useAppStore((s) => s.navigate)
  const startHosting = useRoomStore((s) => s.startHosting)
  const mode = useRoomStore((s) => s.mode)
  const error = useRoomStore((s) => s.error)

  const [roomName, setRoomName] = useState('Mesa da Guilda')
  const [password, setPassword] = useState(() => generateRoomPassword())
  const [port, setPort] = useState(String(DEFAULT_ROOM_PORT))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await startHosting({
      roomName: roomName.trim() || 'Sala',
      password: password.trim().toUpperCase(),
      port: Number(port) || DEFAULT_ROOM_PORT,
    })
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={() => navigate('home')} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Criar Nova Sala</h1>
          <p className="screen__subtitle">
            Só a rede: seu aparelho vira o servidor local. A ficha (Jogador ou Mestre) você escolhe em seguida.
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field__label">Nome da sala</span>
          <input className="input" value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={40} />
        </label>

        <div className="field">
          <span className="field__label">Senha da sala</span>
          <div className="field__row">
            <input
              className="input input--mono"
              value={password}
              onChange={(e) => setPassword(e.target.value.toUpperCase())}
              maxLength={12}
              required
            />
            <button type="button" className="btn btn--ghost" onClick={() => setPassword(generateRoomPassword())}>
              🎲
            </button>
          </div>
        </div>

        <label className="field">
          <span className="field__label">Porta</span>
          <input
            className="input input--mono"
            inputMode="numeric"
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
          />
        </label>

        <button type="submit" className="btn btn--gold btn--block" disabled={mode === 'starting'}>
          {mode === 'starting' ? 'Iniciando servidor…' : '🏰 Abrir a sala'}
        </button>
      </form>
    </div>
  )
}

function HostLobby() {
  const navigate = useAppStore((s) => s.navigate)
  const room = useRoomStore((s) => s.room)
  const serverKind = useRoomStore((s) => s.serverKind)
  const session = useRoomStore((s) => s.session)
  const self = useRoomStore((s) => s.self)
  const members = useMemo(() => membersOf(session), [session])
  const leave = useRoomStore((s) => s.leave)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const invite = room ? encodeInvite({ address: { host: room.host, port: room.port }, password: room.password }) : ''

  useEffect(() => {
    if (!invite || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, invite, { width: 200, margin: 1 }, (err) => {
      if (err) console.warn('[qr]', err)
    })
  }, [invite])

  if (!room) return null
  const address = formatAddress({ host: room.host, port: room.port })

  return (
    <div className="screen">
      <header className="screen__header">
        <div>
          <h1 className="screen__title">🏰 {room.name}</h1>
          <p className="screen__subtitle">
            Sala aberta{self ? ` · você é ${self.Name}` : ' · servidor rodando, nenhuma ficha ainda'}. Compartilhe os dados
            abaixo com quem está no mesmo Wi-Fi.
          </p>
        </div>
      </header>

      {serverKind === 'loopback' && (
        <div className="info-banner">
          Rodando no navegador: aqui não há servidor WebSocket na LAN. Esta sala aceita jogadores abertos em{' '}
          <strong>outras abas deste mesmo navegador</strong> usando o endereço <strong>{LOOPBACK_HOST}</strong>. No app
          Android o servidor sobe no IP do celular.
        </div>
      )}

      <section className="invite" aria-label="Convite">
        <div className="invite__qr">
          <canvas ref={canvasRef} aria-label="QR Code do convite" />
        </div>
        <div className="invite__grid">
          <div className="invite__cell">
            <span className="invite__key">Endereço</span>
            <span className="invite__value">{address}</span>
          </div>
          <div className="invite__cell">
            <span className="invite__key">Senha</span>
            <span className="invite__value">{room.password}</span>
          </div>
          <div className="invite__cell invite__cell--wide">
            <span className="invite__key">Link de convite</span>
            <span className="invite__value" style={{ fontSize: 12, letterSpacing: 0 }}>
              {invite}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigator.clipboard?.writeText(invite).catch(() => undefined)}
        >
          📋 Copiar convite
        </button>
      </section>

      <section>
        <span className="character-list__label">Membros ({members.length})</span>
        <div className="member-list" style={{ marginTop: 8 }}>
          {members.map((m) => (
            <div className="member" key={m.id}>
              <span className="member__avatar">{m.avatar}</span>
              <span>
                <span className="member__name">{m.name}</span>
                <br />
                <span className="member__meta">
                  {m.role === 'master' ? 'Mestre' : m.title || 'Jogador'}
                  {m.id === self?.PlayerId && ' (você)'}
                </span>
              </span>
              <span className={`member__status ${m.online ? 'is-online' : ''}`}>{m.online ? 'online' : 'offline'}</span>
            </div>
          ))}
          {members.length === 0 && <div className="member-list__empty">Aguardando jogadores entrarem…</div>}
        </div>
      </section>

      <div className="btn-row" style={{ marginTop: 'auto' }}>
        <button type="button" className="btn btn--danger" onClick={() => void leave().then(() => navigate('home'))}>
          Encerrar sala
        </button>
        {self ? (
          <button type="button" className="btn btn--primary" onClick={() => navigate('session')}>
            🎒 Abrir inventário
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => navigate('select-profile')}>
            🧞 Escolher perfil
          </button>
        )}
      </div>
    </div>
  )
}
