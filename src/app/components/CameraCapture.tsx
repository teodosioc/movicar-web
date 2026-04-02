'use client'

import { useEffect, useRef, useState } from 'react'

type CameraCaptureProps = {
  onCapture: (file: File) => void
  onClose: () => void
}

export default function CameraCapture({
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [loadingCamera, setLoadingCamera] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const stopCamera = () => {
    const video = videoRef.current
    const stream = streamRef.current

    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch (error) {
          console.warn('Erro ao parar track da câmera:', error)
        }
      })
    }

    streamRef.current = null

    if (video) {
      try {
        video.pause()
      } catch {}

      video.onloadedmetadata = null
      video.oncanplay = null
      video.srcObject = null
      video.removeAttribute('src')
      video.load()
    }

    setCameraReady(false)
    setLoadingCamera(false)
    setCameraError('')
  }

  const startCamera = async () => {
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

    try {
      setLoadingCamera(true)
      setCameraError('')
      setCameraReady(false)

      if (!window.isSecureContext && !isLocalhost) {
        setCameraError(
          'A câmera só funciona em conexão segura (HTTPS) ou em localhost. Para testar no celular, publique o MoviCar em HTTPS.'
        )
        setLoadingCamera(false)
        return
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Não foi possível acessar a API da câmera neste contexto do navegador.'
        )
        setLoadingCamera(false)
        return
      }

      stopCamera()

      let mediaStream: MediaStream

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (firstError) {
        console.warn('Falha ao abrir câmera traseira. Tentando fallback...', firstError)

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = mediaStream

      const video = videoRef.current
      if (!video) {
        setCameraError('Não foi possível inicializar o elemento de vídeo.')
        setLoadingCamera(false)
        stopCamera()
        return
      }

      video.srcObject = mediaStream

      video.onloadedmetadata = () => {
        setCameraReady(true)
        setLoadingCamera(false)
        setCameraError('')
      }

      video.oncanplay = () => {
        setCameraReady(true)
        setLoadingCamera(false)
        setCameraError('')
      }

      try {
        await video.play()
      } catch (playError) {
        console.warn('play() falhou, mas o stream pode estar ativo:', playError)
        setLoadingCamera(false)
      }
    } catch (error) {
      console.error(error)
      setCameraError(
        'Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.'
      )
      setLoadingCamera(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const initCamera = async () => {
      if (cancelled || previewUrl) return
      await startCamera()
    }

    initCamera()

    return () => {
      cancelled = true
      stopCamera()

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('A câmera ainda não está pronta para capturar a foto.')
      return
    }

    setIsCapturing(true)
    setCameraError('')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('Não foi possível processar a imagem capturada.')
      setIsCapturing(false)
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Não foi possível gerar a foto.')
          setIsCapturing(false)
          return
        }

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })

        const objectUrl = URL.createObjectURL(file)

        stopCamera()
        setCapturedFile(file)
        setPreviewUrl(objectUrl)
        setIsCapturing(false)
      },
      'image/jpeg',
      0.9
    )
  }

  const handleConfirm = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
  }

  const handleRetake = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setCapturedFile(null)
    setPreviewUrl(null)
    await startCamera()
  }

  const handleClose = () => {
    stopCamera()

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setCapturedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <h2 className="mb-3 text-lg font-bold text-slate-900 md:text-xl">
        Capturar foto
      </h2>

      <p className="mb-4 text-sm leading-6 text-slate-600">
        Posicione o item dentro da área de captura e toque em{' '}
        <span className="font-semibold text-slate-800">
          {previewUrl ? 'Confirmar' : 'Tirar foto'}
        </span>.
      </p>

      {loadingCamera && !previewUrl && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Abrindo câmera...
        </div>
      )}

      {cameraError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {cameraError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-slate-200">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview da foto"
            className="h-[260px] w-full object-cover sm:h-[320px] md:h-[420px]"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-[260px] w-full bg-black object-cover sm:h-[320px] md:h-[420px]"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {previewUrl ? (
          <>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Confirmar
            </button>

            <button
              type="button"
              onClick={handleRetake}
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Refazer
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleTakePhoto}
              disabled={loadingCamera || isCapturing || !cameraReady}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCapturing ? 'Processando...' : 'Tirar foto'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Fechar câmera
            </button>
          </>
        )}
      </div>
    </div>
  )
}