"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  type: "photo" | "video"
  onCapture: (blob: Blob) => Promise<void>
}

export default function CameraCapture({ type, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [status, setStatus] = useState<"idle" | "capturing" | "processing">("idle")

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: type === "video",
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        try {
          await videoRef.current.play()
        } catch (playError: any) {
          if (playError?.name !== "AbortError") {
            throw playError
          }
          console.warn("play() interrompido durante remontagem do vídeo:", playError)
        }
      }

      setCameraReady(true)
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err)

      if (err?.name !== "AbortError") {
        alert("Não foi possível acessar a câmera.")
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setCameraReady(false)
  }

  const takePhoto = async () => {
    if (!videoRef.current) return

    try {
      setStatus("processing")

      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setStatus("idle")
        return
      }

      ctx.drawImage(videoRef.current, 0, 0)

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setStatus("idle")
            return
          }

          try {
            await onCapture(blob)
            stopCamera()
          } catch (err) {
            console.error("Erro ao processar foto:", err)
            alert("Não foi possível finalizar a captura da foto.")
          } finally {
            setStatus("idle")
          }
        },
        "image/jpeg",
        0.92
      )
    } catch (err) {
      console.error("Erro ao capturar foto:", err)
      setStatus("idle")
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return

    try {
      videoChunksRef.current = []

      const recorder = new MediaRecorder(streamRef.current)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(videoChunksRef.current, {
            type: "video/webm",
          })

          await onCapture(blob)
          stopCamera()
        } catch (error) {
          console.error("Erro ao finalizar gravação:", error)
          alert("Não foi possível finalizar a gravação.")
          stopCamera()
        } finally {
          mediaRecorderRef.current = null
          videoChunksRef.current = []
          setStatus("idle")
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setStatus("capturing")
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setStatus("processing")
      mediaRecorderRef.current.stop()
    }
  }

  useEffect(() => {
    startCamera()

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop()
        } catch (err) {
          console.warn("Erro ao encerrar recorder no cleanup:", err)
        }
      }

      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="w-full rounded-2xl"
          playsInline
          muted
          autoPlay
        />
      </div>

      {type === "photo" ? (
        <button
          onClick={takePhoto}
          disabled={!cameraReady || status === "processing"}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "processing" ? "Processando..." : "Tirar foto"}
        </button>
      ) : status === "capturing" ? (
        <button
          onClick={stopRecording}
          className="w-full rounded-2xl bg-red-600 py-3 text-white"
        >
          Parar gravação
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={!cameraReady || status === "processing"}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "processing" ? "Processando..." : "Gravar vídeo"}
        </button>
      )}
    </div>
  )
}