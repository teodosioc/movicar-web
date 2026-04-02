'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import CameraCapture from './CameraCapture'

type Props = {
  sessionId: string
  item: {
    id: string
    type: 'photo' | 'video'
    name: string
    required: boolean
  }
}

export default function InspectionStep({ sessionId, item }: Props) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Buscar mídia existente ao abrir
  useEffect(() => {
    async function fetchMedia() {
      const { data } = await supabase
        .from('inspection_media')
        .select('file_url')
        .eq('session_id', sessionId)
        .eq('item_id', item.id)
        .maybeSingle()

      if (data?.file_url) {
        setMediaUrl(data.file_url)
      }

      setLoading(false)
    }

    fetchMedia()
  }, [sessionId, item.id])

  // 🔹 Captura (foto ou vídeo)
  const handleCapture = async (file: Blob) => {
    try {
      const fileName = `${sessionId}/${item.id}/${Date.now()}`

      // upload
      const { error } = await supabase.storage
        .from('inspections')
        .upload(fileName, file, {
          contentType: item.type === 'photo' ? 'image/jpeg' : 'video/webm',
          upsert: true
        })

      if (error) throw error

      // pegar URL pública
      const { data } = supabase
        .storage
        .from('inspections')
        .getPublicUrl(fileName)

      const fileUrl = data.publicUrl

      // 🔥 ATUALIZA UI IMEDIATO (resolve seu bug)
      setMediaUrl(fileUrl)

      // salvar no banco (assíncrono)
      await supabase.from('inspection_media').upsert({
        session_id: sessionId,
        item_id: item.id,
        file_url: fileUrl,
        type: item.type
      })

    } catch (err) {
      console.error(err)
      alert('Erro ao enviar mídia')
    }
  }

  // 🔹 Refazer
  const handleReset = () => {
    setMediaUrl(null)
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-4">

      <h2 className="text-lg font-semibold">
        {item.name}
        {item.required && <span className="text-red-500"> *</span>}
      </h2>

      {/* 🔥 SE TEM MÍDIA → MOSTRA PREVIEW */}
      {mediaUrl ? (
        <div className="space-y-3">

          {item.type === 'photo' ? (
            <img
              src={mediaUrl}
              alt="preview"
              className="w-full rounded-lg border"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              className="w-full rounded-lg border"
            />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Refazer
            </button>

            <span className="text-green-600 font-medium">
              ✔ Capturado com sucesso
            </span>
          </div>

        </div>
      ) : (
        // 🔥 SE NÃO TEM → MOSTRA CÂMERA
        <CameraCapture
          type={item.type}
          onCapture={handleCapture}
        />
      )}

    </div>
  )
}