import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useIconStore } from '../store/iconStore'
import type { CustomIconKind } from '../storage/repositories'
import { ImageCropper } from '../components/ImageCropper'
import './screens.css'
import './IconCropScreen.css'

const OUTPUT = 144

/** Recorte da imagem escolhida; o resultado vira um ícone de personagem ou de item. */
export function IconCropScreen() {
  const draft = useIconStore((s) => s.draft)
  const setDraft = useIconStore((s) => s.setDraft)
  const addIcon = useIconStore((s) => s.add)
  const navigate = useAppStore((s) => s.navigate)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!draft) navigate('custom-icons')
  }, [draft, navigate])

  if (!draft) return null

  const finish = () => {
    setDraft(null)
    navigate('custom-icons')
  }

  const save = async (kind: CustomIconKind, crop: () => string | null) => {
    const dataUrl = crop()
    if (!dataUrl || saving) return
    setSaving(true)
    await addIcon(kind, dataUrl)
    finish()
  }

  return (
    <div className="screen crop">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={finish} aria-label="Cancelar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Alinhar imagem</h1>
          <p className="screen__subtitle">Arraste e amplie: a parte dentro da grade vira o ícone.</p>
        </div>
      </header>

      <ImageCropper
        src={draft}
        output={OUTPUT}
        renderActions={(crop, ready) => (
          <div className="crop__actions">
            <span className="field__label">Salvar como</span>
            <div className="crop__kinds">
              <button type="button" className="btn btn--primary" disabled={!ready || saving} onClick={() => void save('character', crop)}>
                🧝 Ícone de personagem
              </button>
              <button type="button" className="btn btn--gold" disabled={!ready || saving} onClick={() => void save('item', crop)}>
                🗡️ Ícone de item
              </button>
            </div>
            <button type="button" className="btn btn--ghost" onClick={finish}>
              Cancelar
            </button>
          </div>
        )}
      />
    </div>
  )
}
