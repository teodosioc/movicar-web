'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  type: 'photo' | 'video'
  onCapture: (file: Blob) => void | Promise<void>
}

type RecordingState = 'idle' | 'recording' | 'processing'

export default function CameraCapture({ type, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (error) {
            console.warn('Erro ao parar track da câmera:', error)
          }
        })
      }
    } finally {
      streamRef.current = null

      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.load()
      }

      setCameraReady(false)
    }
  }

  const resetRecorderState = () => {
    mediaRecorderRef.current = null
    videoChunksRef.current = []
    setRecordingState('idle')
  }

  const fullCleanup = () => {
    clearTimer()

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      } catch (error) {
        console.warn('Erro ao interromper recorder:', error)
      }
    }

    stopCamera()
    resetRecorderState()
  }

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || ''
    )
  }

  const startCamera = async () => {
    try {
      fullCleanup()

      let stream: MediaStream

      if (isMobileDevice()) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
            },
            audio: type === 'video',
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: type === 'video',
          })
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: type === 'video',
        })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play()
            setCameraReady(true)
          } catch (error) {
            console.error('Erro ao iniciar preview da câmera:', error)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      alert('Não foi possível acessar a câmera.')
    }
  }

  useEffect(() => {
    startCamera()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        fullCleanup()
      }
    }

    const handlePageHide = () => {
      fullCleanup()
    }

    const handleBeforeUnload = () => {
      fullCleanup()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      fullCleanup()
    }
  }, [type])

  const takePhoto = async () => {
    const video = videoRef.current
    if (!video || !cameraReady) {
      alert('Aguarde a câmera carregar.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      alert('Não foi possível capturar a imagem.')
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })

    if (!blob) {
      alert('Não foi possível gerar a foto.')
      return
    }

    stopCamera()
    resetRecorderState()
    await onCapture(blob)
  }

  const startRecording = () => {
    if (!streamRef.current) {
      alert('Câmera não disponível.')
      return
    }

    try {
      videoChunksRef.current = []

      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm',
      })

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          clearTimer()
          const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
          stopCamera()
          resetRecorderState()
          await onCapture(blob)
        } catch (error) {
          console.error('Erro ao finalizar gravação:', error)
          alert('Não foi possível finalizar a gravação.')
          resetRecorderState()
          stopCamera()
        }
      }

      recorder.start()
      setRecordingState('recording')

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording()
        }
      }, 30000)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Não foi possível iniciar a gravação.')
      setRecordingState('idle')
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      setRecordingState('processing')
      clearTimer()
      recorder.stop()
    }
  }

  const handleMainAction = async () => {
    if (type === 'photo') {
      await takePhoto()
      return
    }

    if (recordingState === 'idle') {
      startRecording()
      return
    }

    if (recordingState === 'recording') {
      stopRecording()
    }
  }

  const getButtonLabel = () => {
    if (type === 'photo') return 'Tirar foto'
    if (recordingState === 'idle') return 'Gravar vídeo'
    if (recordingState === 'recording') return 'Parar gravação'
    return 'Processando...'
  }

  const isDisabled =
    !cameraReady || (type === 'video' && recordingState === 'processing')

  const buttonClass =
    type === 'video' && recordingState === 'recording'
      ? 'bg-slate-700 hover:bg-slate-800'
      : 'bg-emerald-600 hover:bg-emerald-700'

  return (
    <div className="space-y-3">
      <div className="w-full aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={type === 'photo'}
          className="h-full w-full object-cover"
        />
      </div>

      <button
        type="button"
        onClick={handleMainAction}
        disabled={isDisabled}
        className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${buttonClass}`}
      >
        {getButtonLabel()}
      </button>
    </div>
  )
}