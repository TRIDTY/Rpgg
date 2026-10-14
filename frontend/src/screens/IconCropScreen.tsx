import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useAppStore } from '../store/appStore'
import { useIconStore } from '../store/iconStore'
import type { CustomIconKind } from '../storage/repositories'
import './screens.css'
import './IconCropScreen.css'

const FRAME = 300
const OUTPUT = 144
const MAX_ZOOM = 4

interface View {
  x: number
  y: number
  zoom: number
}

interface PointerInfo {
  x: number
  y: number
}

/** Recorte quadrado: o usuário arrasta/amplia a imagem sob uma grade e salva como avatar ou sprite. */
export function IconCropScreen() {
  const draft = useIconStore((s) => s.draft)
  const setDraft = useIconStore((s) => s.setDraft)
  const addIcon = useIconStore((s) => s.add)
  const navigate = useAppStore((s) => s.navigate)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 })
  const pointers = useRef(new Map<number, PointerInfo>())
  const gesture = useRef<{ view: View; dist: number } | null>(null)
  const gestureOrigin = useRef({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!draft) navigate('custom-icons')
  }, [draft, navigate])

  if (!draft) return null

  // escala em que o lado menor da imagem cobre exatamente o quadro
  const cover = natural ? FRAME / Math.min(natural.w, natural.h) : 1
  const scale = cover * view.zoom

  const clamp = (v: View): View => {
    if (!natural) return v
    const halfW = (natural.w * cover * v.zoom - FRAME) / 2
    const halfH = (natural.h * cover * v.zoom - FRAME) / 2
    return {
      zoom: Math.min(MAX_ZOOM, Math.max(1, v.zoom)),
      x: Math.min(halfW, Math.max(-halfW, v.x)),
      y: Math.min(halfH, Math.max(-halfH, v.y)),
    }
  }

  const centroid = () => {
    const pts = [...pointers.current.values()]
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length
    return { x, y }
  }
  const distance = () => {
    const pts = [...pointers.current.values()]
    if (pts.length < 2) return 0
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ponteiro sintético sem captura (ex.: automação); o arrasto segue sem ela
    }
    gesture.current = { view, dist: distance() }
    gestureOrigin.current = centroid()
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const c = centroid()
    const start = gesture.current.view
    const ratio = gesture.current.dist > 0 ? distance() / gesture.current.dist : 1
    setView(
      clamp({
        zoom: start.zoom * ratio,
        x: start.x + (c.x - gestureOrigin.current.x),
        y: start.y + (c.y - gestureOrigin.current.y),
      }),
    )
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) gesture.current = null
    else {
      gesture.current = { view, dist: distance() }
      gestureOrigin.current = centroid()
    }
  }

  const setZoom = (zoom: number) => setView((v) => clamp({ ...v, zoom }))

  const save = async (kind: CustomIconKind) => {
    const img = imgRef.current
    if (!img || !natural || saving) return
    setSaving(true)
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // canto superior esquerdo da imagem em coordenadas do quadro
    const left = FRAME / 2 - (natural.w * scale) / 2 + view.x
    const top = FRAME / 2 - (natural.h * scale) / 2 + view.y
    ctx.drawImage(img, -left / scale, -top / scale, FRAME / scale, FRAME / scale, 0, 0, OUTPUT, OUTPUT)
    let dataUrl = canvas.toDataURL('image/webp', 0.82)
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    await addIcon(kind, dataUrl)
    setDraft(null)
    navigate('custom-icons')
  }

  const cancel = () => {
    setDraft(null)
    navigate('custom-icons')
  }

  return (
    <div className="screen crop">
      <header className="screen__header">
        <button type="button" className="screen__back" onClick={cancel} aria-label="Cancelar">
          ‹
        </button>
        <div>
          <h1 className="screen__title">Alinhar imagem</h1>
          <p className="screen__subtitle">Arraste e amplie: a parte dentro da grade vira o ícone.</p>
        </div>
      </header>

      <div className="crop__stage">
        <div
          className="crop__frame"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            className="crop__image"
            src={draft}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={{
              width: natural ? natural.w * scale : undefined,
              height: natural ? natural.h * scale : undefined,
              transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))`,
            }}
          />
          <div className="crop__grid" aria-hidden />
        </div>
      </div>

      <label className="crop__zoom">
        <span className="field__label">Zoom</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
        />
      </label>

      <div className="crop__actions">
        <span className="field__label">Salvar como</span>
        <div className="crop__kinds">
          <button type="button" className="btn btn--primary" disabled={!natural || saving} onClick={() => void save('character')}>
            🧝 Ícone de personagem
          </button>
          <button type="button" className="btn btn--gold" disabled={!natural || saving} onClick={() => void save('item')}>
            🗡️ Ícone de item
          </button>
        </div>
        <button type="button" className="btn btn--ghost" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
