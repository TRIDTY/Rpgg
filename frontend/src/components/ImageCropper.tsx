import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import './ImageCropper.css'

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

interface Props {
  src: string
  /** Lado do quadrado exportado, em px. */
  output: number
  frame?: number
  /** Qualidade webp/jpeg (0–1). */
  quality?: number
  /** Recebe `crop()`, que devolve a data URL do quadro atual (ou null se a imagem ainda não carregou). */
  renderActions: (crop: () => string | null, ready: boolean) => ReactNode
}

/** Quadro quadrado com grade 3×3: arrastar (1 dedo), pinça (2 dedos) ou slider ajustam a região exportada. */
export function ImageCropper({ src, output, frame = 300, quality = 0.82, renderActions }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const natural = img ? { w: img.naturalWidth, h: img.naturalHeight } : null
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 })
  const pointers = useRef(new Map<number, PointerInfo>())
  const gesture = useRef<{ view: View; dist: number } | null>(null)
  const gestureOrigin = useRef({ x: 0, y: 0 })

  // escala em que o lado menor da imagem cobre exatamente o quadro
  const cover = natural ? frame / Math.min(natural.w, natural.h) : 1
  const scale = cover * view.zoom

  const clamp = (v: View): View => {
    if (!natural) return v
    const halfW = (natural.w * cover * v.zoom - frame) / 2
    const halfH = (natural.h * cover * v.zoom - frame) / 2
    return {
      zoom: Math.min(MAX_ZOOM, Math.max(1, v.zoom)),
      x: Math.min(halfW, Math.max(-halfW, v.x)),
      y: Math.min(halfH, Math.max(-halfH, v.y)),
    }
  }

  const centroid = () => {
    const pts = [...pointers.current.values()]
    return {
      x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
      y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
    }
  }
  const distance = () => {
    const pts = [...pointers.current.values()]
    return pts.length < 2 ? 0 : Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
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

  const crop = (): string | null => {
    if (!img || !natural) return null
    const canvas = document.createElement('canvas')
    canvas.width = output
    canvas.height = output
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // canto superior esquerdo da imagem em coordenadas do quadro
    const left = frame / 2 - (natural.w * scale) / 2 + view.x
    const top = frame / 2 - (natural.h * scale) / 2 + view.y
    ctx.drawImage(img, -left / scale, -top / scale, frame / scale, frame / scale, 0, 0, output, output)
    const webp = canvas.toDataURL('image/webp', quality)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality)
  }

  return (
    <div className="cropper">
      <div className="cropper__stage">
        <div
          className="cropper__frame"
          style={{ width: frame, height: frame }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            className="cropper__image"
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setImg(e.currentTarget)}
            style={{
              width: natural ? natural.w * scale : undefined,
              height: natural ? natural.h * scale : undefined,
              transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))`,
            }}
          />
          <div className="cropper__grid" aria-hidden />
        </div>
      </div>

      <label className="cropper__zoom">
        <span className="field__label">Zoom</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(e) => setView((v) => clamp({ ...v, zoom: Number(e.target.value) }))}
          aria-label="Zoom"
        />
      </label>

      {renderActions(crop, natural !== null)}
    </div>
  )
}
