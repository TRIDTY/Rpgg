import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useIconStore } from '../store/iconStore'
import type { CustomIcon, CustomIconKind } from '../storage/repositories'
import { pickImage, type ImageSource } from '../services/imagePicker'
import { Modal } from '../components/Modal'
import './screens.css'
import './CustomIconsScreen.css'

const SECTIONS: { kind: CustomIconKind; title: string; hint: string }[] = [
  { kind: 'character', title: '🧝 Ícones de personagem', hint: 'Aparecem na aba "Personalizados" ao criar uma ficha ou um bot.' },
  { kind: 'item', title: '🗡️ Ícones de item', hint: 'Aparecem na aba "Personalizados" da forja do Mestre.' },
]

export function CustomIconsScreen() {
  const navigate = useAppStore((s) => s.navigate)
  const icons = useIconStore((s) => s.icons)
  const removeIcon = useIconStore((s) => s.remove)
  const setDraft = useIconStore((s) => s.setDraft)
  const [chooser, setChooser] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (source: ImageSource) => {
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await pickImage(source)
      if (!dataUrl) return
      setDraft(dataUrl)
      setChooser(false)
      navigate('crop-icon')
    } catch {
      setError('Não foi possível abrir a imagem. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const confirmRemove = (icon: CustomIcon) => {
    if (confirm('Apagar este ícone? Fichas e itens que já o usam continuam com a imagem.')) void removeIcon(icon.id)
  }

  return (
    <div className="screen custom-icons">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={() => navigate('home')} aria-label="Voltar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Ícones personalizados</h1>
          <p className="screen__subtitle">Suas fotos viram avatares e sprites de item, salvos neste aparelho.</p>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {SECTIONS.map((section) => {
        const list = icons.filter((i) => i.kind === section.kind)
        return (
          <section key={section.kind} className="icon-section" aria-label={section.title}>
            <div className="icon-section__head">
              <h2 className="icon-section__title">{section.title}</h2>
              <span className="icon-section__count">{list.length}</span>
            </div>
            <p className="icon-section__hint">{section.hint}</p>
            {list.length === 0 ? (
              <div className="icon-section__empty">Nenhum ainda — use o botão 📷 para subir uma imagem.</div>
            ) : (
              <div className="icon-grid">
                {list.map((icon) => (
                  <button
                    type="button"
                    key={icon.id}
                    className="icon-grid__item"
                    title="Toque para apagar"
                    aria-label={`Apagar ícone de ${section.kind === 'character' ? 'personagem' : 'item'}`}
                    onClick={() => confirmRemove(icon)}
                  >
                    <img src={icon.dataUrl} alt="" draggable={false} />
                    <span className="icon-grid__remove" aria-hidden>
                      ✕
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}

      <button type="button" className="upload-fab" onClick={() => setChooser(true)} aria-label="Subir imagem">
        <span className="upload-fab__icon">📷</span>
        <span className="upload-fab__label">Subir imagem</span>
      </button>

      {chooser && (
        <Modal title="📷 Subir imagem" onClose={() => (busy ? undefined : setChooser(false))}>
          <div className="upload-choice">
            <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => void pick('camera')}>
              📸 Tirar foto
            </button>
            <button type="button" className="btn btn--gold btn--block" disabled={busy} onClick={() => void pick('gallery')}>
              🖼️ Escolher da galeria
            </button>
            <button type="button" className="btn btn--ghost btn--block" disabled={busy} onClick={() => setChooser(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
