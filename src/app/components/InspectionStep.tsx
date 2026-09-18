'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { getInspectionExampleImage } from '@/app/lib/inspectionExampleImage'
import {
  invalidateInspectionStepMediaPreview,
  loadInspectionStepMediaPreview,
} from '@/app/lib/inspectionStepMediaPreview'
import CameraCapture from './CameraCapture'

type Props = {
  sessionId: string
  item: {
    id: string
    type: 'photo' | 'video'
    name: string
    required: boolean
    order_index: number
  }
  onCompleted?: (completed: boolean) => void
}

type GeoData = {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
}

type MediaCheckState = 'checking' | 'done' | 'error'

export default function InspectionStep({ sessionId, item, onCompleted }: Props) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mediaCheck, setMediaCheck] = useState<MediaCheckState>('checking')
  const [captureStarted, setCaptureStarted] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const onCompletedRef = useRef(onCompleted)
  onCompletedRef.current = onCompleted

  // Verifica mídia já registrada em paralelo com a exibição da orientação.
  // Erro de consulta bloqueia a captura (não é tratado como ausência de mídia).
  const runMediaCheck = useCallback(
    async (isCancelled?: () => boolean) => {
      setMediaCheck('checking')

      const { signedUrl, error } = await loadInspectionStepMediaPreview(
        sessionId,
        item.id
      )

      if (isCancelled?.()) return

      if (error === 'db') {
        setMediaUrl(null)
        setPreviewError(false)
        onCompletedRef.current?.(false)
        setMediaCheck('error')
        return
      }

      if (signedUrl) {
        setMediaUrl(signedUrl)
        onCompletedRef.current?.(true)
      } else {
        setMediaUrl(null)
        onCompletedRef.current?.(false)
      }

      setPreviewError(false)
      setMediaCheck('done')
    },
    [sessionId, item.id]
  )

  useEffect(() => {
    let cancelled = false
    void runMediaCheck(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [runMediaCheck])

  const exampleImage = useMemo(() => getInspectionExampleImage(item), [item])

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
        () => {
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
      setLoading(true)
      setPreviewError(false)
      onCompleted?.(false)

      const extension = item.type === 'photo' ? 'jpg' : 'webm'
      const filePath = `${sessionId}/${String(item.order_index).padStart(2, '0')}_${item.id}.${extension}`
      const nowIso = new Date().toISOString()
      const mediaType = item.type === 'photo' ? 'photo' : 'video'
      const deviceModel =
        typeof navigator !== 'undefined' ? navigator.userAgent : null
      const osVersion = getOsVersion()

      const [geoData, createdBy] = await Promise.all([
        getGeoData(),
        getCurrentUserId(),
      ])

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
          throw insertError
        }
      }

      invalidateInspectionStepMediaPreview(sessionId, item.id)

      const preview = URL.createObjectURL(file)
      setMediaUrl(preview)
      setCaptureStarted(false)
      onCompleted?.(true)
    } catch (err) {
      console.error(err)
      alert('Erro ao enviar mídia')
      setMediaUrl(null)
      setCaptureStarted(false)
      setPreviewError(false)
      onCompleted?.(false)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    invalidateInspectionStepMediaPreview(sessionId, item.id)
    setMediaUrl(null)
    setCaptureStarted(false)
    setPreviewError(false)
    onCompleted?.(false)
  }

  if (loading) {
    // Upload/processamento da captura em andamento.
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
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="text-sm text-slate-500">
                Exemplo de como a {item.type === 'video' ? 'gravação' : 'foto'} deve ser feita.
              </p>
            </div>
          )}

          {mediaCheck === 'error' ? (
            <div className="space-y-3">
              <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                Não foi possível verificar se esta etapa já possui mídia
                registrada. Verifique sua conexão e tente novamente.
              </p>

              <button
                onClick={() => void runMediaCheck()}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCaptureStarted(true)}
              disabled={mediaCheck === 'checking'}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mediaCheck === 'checking'
                ? 'Verificando etapa...'
                : item.type === 'video'
                  ? 'Gravar vídeo'
                  : 'Tirar foto'}
            </button>
          )}
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
            {item.type === 'video'
              ? 'Sair do modo gravação'
              : 'Sair da câmera'}
          </button>
        </div>
      )}
    </div>
  )
}