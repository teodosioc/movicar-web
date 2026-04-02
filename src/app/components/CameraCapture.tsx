'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  type: 'photo' | 'video'
  onCapture: (file: Blob) => void
}

export default function CameraCapture({ type, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    startCamera()

    return () => {
      cleanup()
    }
  }, [type])

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
    videoChunksRef.current = []
    setRecording(false)
    setCameraReady(false)
  }

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false

    const userAgent = navigator.userAgent || navigator.vendor || ''
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

    return mobileRegex.test(userAgent)
  }

  const startCamera = async () => {
    try {
      cleanup()

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

    cleanup()
    onCapture(blob)
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

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        cleanup()
        onCapture(blob)
      }

      recorder.start()
      setRecording(true)

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 30000)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Não foi possível iniciar a gravação.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={type === 'photo'}
        className="w-full rounded-2xl border border-slate-200 bg-black"
      />

      {type === 'photo' ? (
        <button
          type="button"
          onClick={takePhoto}
          disabled={!cameraReady}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Tirar foto
        </button>
      ) : (
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={!cameraReady}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
            recording ? 'bg-slate-700 hover:bg-slate-800' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {recording ? 'Parar gravação' : 'Gravar vídeo'}
        </button>
      )}
    </div>
  )
}