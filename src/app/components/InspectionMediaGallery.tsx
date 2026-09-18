'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react'

export type GalleryMediaItem = {
  id: string
  url: string | null
  type: 'photo' | 'video'
  /** Nome da etapa da vistoria, quando identificada. */
  label: string | null
}

type Props = {
  items: GalleryMediaItem[]
  initialIndex: number
  onClose: () => void
}

const MIN_ZOOM = 1 // 1 = ajustado à tela
const MAX_ZOOM = 8
const ZOOM_STEP = 1.25
const SWIPE_MIN_PX = 60

type Offset = { x: number; y: number }

/** Gesto em andamento na área da foto (Pointer Events, sem dependências). */
type GestureState = {
  mode: 'single' | 'pinch' | null
  startX: number
  startY: number
  startOffset: Offset
  startZoom: number
  startDist: number
  startMid: Offset
  swipeDx: number
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function InspectionMediaGallery({
  items,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(() =>
    clamp(initialIndex, 0, Math.max(0, items.length - 1))
  )
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  const dialogRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pointers = useRef(new Map<number, Offset>())
  const gesture = useRef<GestureState | null>(null)

  const current = items[index]
  const isPhoto = current?.type === 'photo'
  const canPrev = index > 0
  const canNext = index < items.length - 1

  // Dimensões efetivas após rotação (90/270 trocam largura e altura)
  const rotated = rotation % 180 !== 0
  const fitScale = useMemo(() => {
    if (!natural || !stageSize) return 1
    const effW = rotated ? natural.h : natural.w
    const effH = rotated ? natural.w : natural.h
    if (effW <= 0 || effH <= 0) return 1
    return Math.min(stageSize.w / effW, stageSize.h / effH)
  }, [natural, stageSize, rotated])

  const clampOffset = useCallback(
    (off: Offset, z: number, rot: number): Offset => {
      if (!natural || !stageSize) return { x: 0, y: 0 }
      const isRot = rot % 180 !== 0
      const effW = isRot ? natural.h : natural.w
      const effH = isRot ? natural.w : natural.h
      const scale = fitScale * z
      const maxX = Math.max(0, (effW * scale - stageSize.w) / 2)
      const maxY = Math.max(0, (effH * scale - stageSize.h) / 2)
      return { x: clamp(off.x, -maxX, maxX), y: clamp(off.y, -maxY, maxY) }
    },
    [natural, stageSize, fitScale]
  )

  /** Zoom ancorado num ponto da tela (relativo ao centro do palco). */
  const applyZoom = useCallback(
    (nextZoom: number, focal: Offset = { x: 0, y: 0 }) => {
      setZoom((prevZoom) => {
        const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
        const k = z / prevZoom
        setOffset((prevOff) =>
          clampOffset(
            { x: focal.x - (focal.x - prevOff.x) * k, y: focal.y - (focal.y - prevOff.y) * k },
            z,
            rotation
          )
        )
        return z
      })
    },
    [clampOffset, rotation]
  )

  const resetView = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const rotate = useCallback((delta: number) => {
    setRotation((r) => (r + delta + 360) % 360)
    setOffset({ x: 0, y: 0 })
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex((prev) => {
        const n = clamp(nextIndex, 0, items.length - 1)
        if (n !== prev) {
          // Troca de mídia reinicia zoom, posição, rotação e carregamento
          setZoom(1)
          setRotation(0)
          setOffset({ x: 0, y: 0 })
          setNatural(null)
          setLoadState('loading')
          setAttempt(0)
        }
        return n
      })
    },
    [items.length]
  )

  // Pausa o vídeo ao trocar de item e ao fechar (sem áudio em segundo plano)
  useEffect(() => {
    const video = videoRef.current
    return () => {
      video?.pause()
    }
  }, [index])

  // Pré-carrega apenas a próxima foto (nunca vídeos nem a lista inteira)
  useEffect(() => {
    const next = items[index + 1]
    if (next?.type === 'photo' && next.url) {
      const img = new window.Image()
      img.src = next.url
    }
  }, [index, items])

  // Tamanho do palco (orientação/resize mantêm imagem e controles utilizáveis)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () =>
      setStageSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Limites aplicados na exibição: após resize/rotação a imagem nunca fica
  // fora da área visível. Com a foto ajustada (zoom 1), o offset bruto serve
  // de feedback visual do deslizamento de navegação.
  const displayOffset = zoom > 1 ? clampOffset(offset, zoom, rotation) : offset

  // Bloqueia a rolagem/interação da página de fundo e restaura ao fechar
  useEffect(() => {
    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Foco entra no visualizador ao abrir e volta à origem (miniatura) ao fechar
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      previous?.focus?.()
    }
  }, [])

  // Teclado: Esc fecha; setas navegam; Tab fica preso no visualizador.
  // Teclas com foco no player de vídeo não são interceptadas (exceto Esc).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      const target = e.target as HTMLElement | null
      if (target instanceof HTMLVideoElement) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(index - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(index + 1)
      } else if (e.key === 'Tab') {
        const root = dialogRef.current
        if (!root) return
        const focusables = [
          ...root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), video, [tabindex]:not([tabindex="-1"])'
          ),
        ]
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goTo, index, onClose])

  // Roda do mouse sobre a foto: zoom da imagem, sem rolar o fundo
  useEffect(() => {
    const el = stageRef.current
    if (!el || !isPhoto) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const focal = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      }
      setZoom((prevZoom) => {
        const z = clamp(
          e.deltaY < 0 ? prevZoom * ZOOM_STEP : prevZoom / ZOOM_STEP,
          MIN_ZOOM,
          MAX_ZOOM
        )
        const k = z / prevZoom
        setOffset((prevOff) =>
          clampOffset(
            { x: focal.x - (focal.x - prevOff.x) * k, y: focal.y - (focal.y - prevOff.y) * k },
            z,
            rotation
          )
        )
        return z
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [isPhoto, clampOffset, rotation, index])

  // ----- Gestos de toque/mouse na área da foto (pan, pinça, deslizar) -----

  const stagePoint = (e: React.PointerEvent): Offset => {
    const rect = stageRef.current!.getBoundingClientRect()
    return {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isPhoto) return
    const p = stagePoint(e)
    pointers.current.set(e.pointerId, p)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // Ponteiro pode já não estar ativo; o gesto segue sem captura.
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        mode: 'pinch',
        startX: 0,
        startY: 0,
        startOffset: offset,
        startZoom: zoom,
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        swipeDx: 0,
      }
    } else if (pointers.current.size === 1) {
      gesture.current = {
        mode: 'single',
        startX: p.x,
        startY: p.y,
        startOffset: offset,
        startZoom: zoom,
        startDist: 0,
        startMid: p,
        swipeDx: 0,
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPhoto || !gesture.current || !pointers.current.has(e.pointerId)) return
    const p = stagePoint(e)
    pointers.current.set(e.pointerId, p)
    const g = gesture.current

    if (g.mode === 'pinch' && pointers.current.size >= 2) {
      // Pinça: amplia em torno do ponto médio; nunca dispara navegação
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const z = clamp(g.startZoom * (dist / g.startDist), MIN_ZOOM, MAX_ZOOM)
      const k = z / g.startZoom
      setZoom(z)
      setOffset(
        clampOffset(
          {
            x: mid.x - (g.startMid.x - g.startOffset.x) * k,
            y: mid.y - (g.startMid.y - g.startOffset.y) * k,
          },
          z,
          rotation
        )
      )
      return
    }

    if (g.mode === 'single') {
      const dx = p.x - g.startX
      const dy = p.y - g.startY
      if (zoom > 1) {
        // Com zoom ativo, o arraste move a foto (não troca de item)
        setOffset(
          clampOffset(
            { x: g.startOffset.x + dx, y: g.startOffset.y + dy },
            zoom,
            rotation
          )
        )
      } else {
        // Ajustada à tela: deslizamento lateral navega (feedback visual)
        g.swipeDx = dx
        setOffset({ x: dx, y: 0 })
      }
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    if (!isPhoto) return
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (!g) return

    if (g.mode === 'pinch') {
      if (pointers.current.size < 2) {
        // Restante vira arraste simples
        const rest = [...pointers.current.values()][0]
        gesture.current = rest
          ? {
              mode: 'single',
              startX: rest.x,
              startY: rest.y,
              startOffset: offset,
              startZoom: zoom,
              startDist: 0,
              startMid: rest,
              swipeDx: 0,
            }
          : null
      }
      return
    }

    if (g.mode === 'single' && pointers.current.size === 0) {
      gesture.current = null
      if (zoom <= 1) {
        const dx = g.swipeDx
        setOffset({ x: 0, y: 0 })
        if (Math.abs(dx) >= SWIPE_MIN_PX) {
          if (dx < 0 && canNext) goTo(index + 1)
          else if (dx > 0 && canPrev) goTo(index - 1)
        }
      }
    }
  }

  if (!current) return null

  const scale = fitScale * zoom
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de mídias da vistoria"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-black outline-none"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Cabeçalho: contador, etapa e fechar — sempre acessíveis */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div aria-live="polite" className="min-w-0 text-sm text-white">
          <span className="font-semibold">
            {index + 1} de {items.length}
          </span>
          {current.label && (
            <span className="ml-2 truncate text-white/80">{current.label}</span>
          )}
          {current.type === 'video' && (
            <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/90">
              Vídeo
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar galeria"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={22} />
        </button>
      </div>

      {/* Palco da mídia */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className={`absolute inset-0 overflow-hidden ${isPhoto ? 'touch-none' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {isPhoto ? (
            current.url && loadState !== 'error' ? (
              <img
                key={`${current.id}-${attempt}`}
                src={current.url}
                alt={current.label ?? `Foto ${index + 1} da vistoria`}
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight })
                  setLoadState('ready')
                }}
                onError={() => setLoadState('error')}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: natural ? `${natural.w}px` : 'auto',
                  transform: `translate(-50%, -50%) translate(${displayOffset.x}px, ${displayOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
                  visibility: loadState === 'ready' ? 'visible' : 'hidden',
                }}
              />
            ) : null
          ) : current.url && loadState !== 'error' ? (
            <div className="flex h-full w-full items-center justify-center p-2">
              <video
                key={`${current.id}-${attempt}`}
                ref={videoRef}
                src={current.url}
                controls
                playsInline
                preload="metadata"
                onError={() => setLoadState('error')}
                className="max-h-full max-w-full"
              />
            </div>
          ) : null}

          {/* Carregando (apenas fotos; vídeo usa o próprio player) */}
          {isPhoto && loadState === 'loading' && current.url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
                Carregando...
              </p>
            </div>
          )}

          {/* Erro ou mídia indisponível: navegação continua livre */}
          {(loadState === 'error' || !current.url) && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="max-w-xs space-y-3 rounded-2xl bg-white/10 p-4 text-center">
                <p className="text-sm text-white">
                  {current.url
                    ? 'Não foi possível carregar esta mídia.'
                    : 'Mídia indisponível no momento.'}
                </p>
                {current.url && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoadState('loading')
                      setAttempt((a) => a + 1)
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <RefreshCw size={16} />
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Anterior / Próxima — sem retorno automático ao início */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={!canPrev}
          aria-label="Mídia anterior"
          className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={26} />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={!canNext}
          aria-label="Próxima mídia"
          className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={26} />
        </button>
      </div>

      {/* Controles de foto (ocultos para vídeo) */}
      {isPhoto && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => applyZoom(zoom / ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Diminuir zoom"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={18} />
          </button>

          <span
            aria-label="Nível de ampliação"
            className="min-w-[3.5rem] text-center text-sm font-medium text-white"
          >
            {zoomPercent}%
          </span>

          <button
            type="button"
            onClick={() => applyZoom(zoom * ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Aumentar zoom"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            onClick={resetView}
            aria-label="Ajustar à tela"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize size={18} />
          </button>

          <button
            type="button"
            onClick={() => rotate(-90)}
            aria-label="Girar 90° para a esquerda"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            onClick={() => rotate(90)}
            aria-label="Girar 90° para a direita"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <RotateCw size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
