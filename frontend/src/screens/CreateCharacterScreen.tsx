import { useState, type FormEvent } from 'react'
import type { AttributeValue, PlayerRole } from '../types'
import { AVATAR_OPTIONS, createCharacter, DEFAULT_ATTRIBUTES } from '../domain/character'
import { useAppStore } from '../store/appStore'
import './screens.css'

interface AttributeRow {
  key: string
  value: string
}

const toRows = (attrs: Record<string, AttributeValue>): AttributeRow[] =>
  Object.entries(attrs).map(([key, value]) => ({ key, value: String(value) }))

const parseValue = (raw: string): AttributeValue => {
  const trimmed = raw.trim()
  if (trimmed === 'true' || trimmed === 'false') return trimmed === 'true'
  const n = Number(trimmed)
  return trimmed !== '' && !Number.isNaN(n) ? n : trimmed
}

export function CreateCharacterScreen() {
  const navigate = useAppStore((s) => s.navigate)
  const saveCharacter = useAppStore((s) => s.saveCharacter)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<PlayerRole>('Player')
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0])
  const [rows, setRows] = useState<AttributeRow[]>(() => toRows(DEFAULT_ATTRIBUTES))
  const [starterKit, setStarterKit] = useState(true)
  const [saving, setSaving] = useState(false)

  const updateRow = (i: number, patch: Partial<AttributeRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    const attributes: Record<string, AttributeValue> = {}
    for (const r of rows) if (r.key.trim()) attributes[r.key.trim()] = parseValue(r.value)
    const profile = createCharacter({ name, title, role, avatar, attributes, starterKit })
    console.log('[save] personagem criado', profile)
    await saveCharacter(profile)
    setSaving(false)
    navigate('home')
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={() => navigate('home')} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Novo personagem</h1>
          <p className="screen__subtitle">A ficha vira um documento JSON salvo neste aparelho.</p>
        </div>
      </header>

      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <span className="field__label">Avatar</span>
          <div className="avatar-picker" role="radiogroup" aria-label="Avatar">
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
            placeholder="Ex.: Aria Ventania"
            maxLength={32}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">Título / Classe</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Arqueira"
            maxLength={32}
          />
        </label>

        <div className="field">
          <span className="field__label">Papel</span>
          <div className="segmented" role="radiogroup">
            {(['Player', 'GM'] as PlayerRole[]).map((r) => (
              <button
                type="button"
                key={r}
                role="radio"
                aria-checked={role === r}
                className={`segmented__option ${role === r ? 'is-selected' : ''}`}
                onClick={() => setRole(r)}
              >
                {r === 'Player' ? '🗡️ Jogador' : '🧙 Mestre (GM)'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Atributos (personalizáveis)</span>
          <div className="attributes">
            {rows.map((r, i) => (
              <div className="attribute" key={i}>
                <input
                  className="input"
                  value={r.key}
                  onChange={(e) => updateRow(i, { key: e.target.value })}
                  placeholder="Atributo"
                  aria-label={`Nome do atributo ${i + 1}`}
                />
                <input
                  className="input"
                  value={r.value}
                  onChange={(e) => updateRow(i, { value: e.target.value })}
                  placeholder="Valor"
                  aria-label={`Valor do atributo ${i + 1}`}
                />
                <button
                  type="button"
                  className="attribute__remove"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  aria-label="Remover atributo"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setRows((rs) => [...rs, { key: '', value: '' }])}
            >
              + Adicionar atributo
            </button>
          </div>
        </div>

        <label className="checkbox">
          <input type="checkbox" checked={starterKit} onChange={(e) => setStarterKit(e.target.checked)} />
          Começar com o kit inicial (espada, poções, ouro, pão e tocha)
        </label>

        <button type="submit" className="btn btn--primary btn--block" disabled={!name.trim() || saving}>
          {saving ? 'Salvando…' : '💾 Salvar ficha'}
        </button>
      </form>
    </div>
  )
}
