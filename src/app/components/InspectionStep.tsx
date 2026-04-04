'use client'

import { useEffect, useMemo, useState } from 'react'
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
  onCompleted?: () => void
}

type GeoData = {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
}

export default function InspectionStep({ sessionId, item, onCompleted }: Props) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [captureStarted, setCaptureStarted] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchMedia() {
      setLoading(true)

      const { data, error } = await supabase
        .from('inspection_media')
        .select('id, file_path, file_url')
        .eq('session_id', sessionId)
        .eq('item_id', item.id)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        console.error('Erro ao buscar mídia:', error)
        setMediaUrl(null)
        setPreviewError(false)
        setLoading(false)
        return
      }

      const storedPath = data?.file_path || data?.file_url

      if (storedPath) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('inspections')
          .createSignedUrl(storedPath, 60 * 60)

        if (!isMounted) return

        if (signedError) {
          console.error('Erro ao gerar signed URL no fetch:', signedError)
          setMediaUrl(null)
        } else {
          setMediaUrl(signedData.signedUrl)
          onCompleted?.()
        }
      } else {
        setMediaUrl(null)
      }

      setPreviewError(false)
      setLoading(false)
    }

    fetchMedia()

    return () => {
      isMounted = false
    }
  }, [sessionId, item.id, onCompleted])

  const exampleImage = useMemo(() => {
    const normalizedName = item.name.toLowerCase()
    const normalizedId = item.id.toLowerCase()

    if (normalizedName.includes('frente') || normalizedId.includes('frente')) {
      return '/examples/foto-frente.png'
    }

    if (normalizedName.includes('traseira') || normalizedId.includes('traseira')) {
      return '/examples/foto-traseira.png'
    }

    if (
      normalizedName.includes('lateral direita') ||
      normalizedName.includes('direita') ||
      normalizedId.includes('direita')
    ) {
      return '/examples/lateral-direita.png'
    }

    if (
      normalizedName.includes('lateral esquerda') ||
      normalizedName.includes('esquerda') ||
      normalizedId.includes('esquerda')
    ) {
      return '/examples/lateral-esquerda.png'
    }

    if (
      normalizedName.includes('quilometragem') ||
      normalizedName.includes('velocimetro') ||
      normalizedName.includes('velocímetro') ||
      normalizedId.includes('quilometragem') ||
      normalizedId.includes('velocimetro')
    ) {
      return '/examples/quilometragem-velocimetro.png'
    }

    return null
  }, [item.id, item.name])

  const getGeoData = async (): Promise<GeoData> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude ?? null,
            longitude: position.coords.longitude ?? null,
            accuracy: position.coords.accuracy ?? null,
          })
        },
        (error) => {
          console.warn('Geolocalização não disponível/autorizada:', error)
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const getOsVersion = () => {
    if (typeof navigator === 'undefined') return null
    return navigator.platform || navigator.userAgent || null
  }

  const getCurrentUserId = async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.warn('Não foi possível obter usuário autenticado:', error)
      return null
    }

    return data.user?.id ?? null
  }

  const handleCapture = async (file: Blob) => {
    try {
      const localPreview = URL.createObjectURL(file)
      setMediaUrl(localPreview)
      setPreviewError(false)

      const extension = item.type === 'photo' ? 'jpg' : 'webm'
      const filePath = `${sessionId}/${item.id}/${Date.now()}.${extension}`
      const nowIso = new Date().toISOString()
      const mediaType = item.type === 'photo' ? 'photo' : 'video'
      const deviceModel =
        typeof navigator !== 'undefined' ? navigator.userAgent : null
      const osVersion = getOsVersion()

      const [geoData, createdBy] = await Promise.all([
        getGeoData(),
        getCurrentUserId(),
      ])

      console.log('UPLOAD → filePath:', filePath)
      console.log('GEO →', geoData)

      const { error: uploadError } = await supabase.storage
        .from('inspections')
        .upload(filePath, file, {
          contentType: item.type === 'photo' ? 'image/jpeg' : 'video/webm',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: existingRecord, error: existingError } = await supabase
        .from('inspection_media')
        .select('id')
        .eq('session_id', sessionId)
        .eq('item_id', item.id)
        .maybeSingle()

      if (existingError) {
        console.error('Erro ao consultar inspection_media:', existingError)
        throw existingError
      }

      const payload = {
        file_url: filePath,
        file_path: filePath,
        media_type: mediaType,
        captured_at: nowIso,
        uploaded_at: nowIso,
        device_model: deviceModel,
        os_version: osVersion,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        location_accuracy: geoData.accuracy,
        created_by: createdBy,
      }

      if (existingRecord?.id) {
        const { error: updateError } = await supabase
          .from('inspection_media')
          .update(payload)
          .eq('id', existingRecord.id)

        if (updateError) {
          console.error('Erro ao atualizar inspection_media:', updateError)
          throw updateError
        }
      } else {
        const { error: insertError } = await supabase
          .from('inspection_media')
          .insert({
            session_id: sessionId,
            item_id: item.id,
            ...payload,
          })

        if (insertError) {
          console.error('Erro ao inserir inspection_media:', insertError)
          throw insertError
        }
      }

      onCompleted?.()
    } catch (err) {
      console.error(err)
      alert('Erro ao enviar mídia')
      setMediaUrl(null)
      setCaptureStarted(false)
      setPreviewError(false)
    }
  }

  const handleReset = () => {
    setMediaUrl(null)
    setCaptureStarted(false)
    setPreviewError(false)
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando...</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {item.name}
        {item.required && <span className="text-red-500"> *</span>}
      </h2>

      {mediaUrl ? (
        <div className="space-y-3">
          <div className="w-full aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-black">
            {!previewError ? (
              item.type === 'photo' ? (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  className="h-full w-full object-cover"
                  onError={() => setPreviewError(true)}
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 text-center text-sm text-slate-500">
                Não foi possível carregar o preview desta mídia.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-xl bg-amber-500 px-4 py-2 text-white"
            >
              Refazer
            </button>

            <span className="text-sm font-medium text-green-600">
              ✔ Capturado com sucesso
            </span>
          </div>
        </div>
      ) : !captureStarted ? (
        <div className="space-y-4">
          {exampleImage && (
            <div className="space-y-2">
              <div className="w-full aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={exampleImage}
                  alt="Exemplo"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="text-sm text-slate-500">
                Exemplo de como a {item.type === 'video' ? 'gravação' : 'foto'} deve ser feita.
              </p>
            </div>
          )}

          <button
            onClick={() => setCaptureStarted(true)}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white"
          >
            {item.type === 'video' ? 'Iniciar gravação' : 'Iniciar captura'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <CameraCapture
          key={`${sessionId}-${item.id}-${item.type}`}
          type={item.type}
          onCapture={handleCapture}
          />

          <button
            onClick={() => setCaptureStarted(false)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            Voltar ao exemplo
          </button>
        </div>
      )}
    </div>
  )
}