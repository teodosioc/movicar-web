'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CameraCapture from '../../components/CameraCapture'

type InspectionItem = {
  id: string
  name: string
  type: 'photo' | 'video'
  required: boolean
  order_index: number
  instructions?: string | null
}

type Vehicle = {
  id: string
  plate: string
}

type CapturedMediaMap = Record<
  string,
  {
    fileUrl: string
    previewUrl: string
    filePath: string
    mediaType: 'photo' | 'video'
  }
>

export default function InspectionPage() {
  const [items, setItems] = useState<InspectionItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [capturedMedia, setCapturedMedia] = useState<CapturedMediaMap>({})
  const [capturing, setCapturing] = useState(false)

  const currentItem = items[currentStepIndex]
  const currentItemCompleted = currentItem ? !!capturedMedia[currentItem.id] : false
  const isLastStep = items.length > 0 && currentStepIndex === items.length - 1

  const completedCount = useMemo(() => {
    return items.filter((item) => !!capturedMedia[item.id]).length
  }, [items, capturedMedia])

  const progressPercentage = useMemo(() => {
    if (items.length === 0) return 0
    return Math.round((completedCount / items.length) * 100)
  }, [completedCount, items.length])

  useEffect(() => {
    loadItems()
    loadVehicles()
  }, [])

  const loadItems = async () => {
    const { data, error } = await supabase.from('inspection_items').select('*')

    if (error) {
      console.error(error)
      alert('Erro ao carregar itens.')
      return
    }

    const ordered = (data || []).sort((a, b) => {
      if (a.type === 'video') return 1
      if (b.type === 'video') return -1
      return a.order_index - b.order_index
    })

    setItems(ordered as InspectionItem[])
  }

  const loadVehicles = async () => {
    const { data, error } = await supabase.from('vehicles').select('*')

    if (error) {
      console.error(error)
      alert('Erro ao carregar veículos.')
      return
    }

    setVehicles(data || [])
  }

  const createSession = async () => {
    if (!selectedVehicle) {
      alert('Selecione um veículo.')
      return null
    }

    if (currentSession) return currentSession

    const { data, error } = await supabase
      .from('inspection_sessions')
      .insert([
        {
          vehicle_id: selectedVehicle,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Erro ao criar sessão.')
      return null
    }

    setCurrentSession(data)
    return data
  }

  const handleCapture = async (file: Blob) => {
    try {
      setLoading(true)

      const session = await createSession()
      if (!session || !currentItem) return

      const oldMedia = capturedMedia[currentItem.id]
      if (oldMedia?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(oldMedia.previewUrl)
      }

      const extension = currentItem.type === 'video' ? 'webm' : 'jpg'
      const filePath = `${session.id}/${currentItem.type}/${Date.now()}.${extension}`
      const previewUrl = URL.createObjectURL(file)

      const { error: uploadError } = await supabase.storage
        .from('inspections')
        .upload(filePath, file, {
          contentType: currentItem.type === 'video' ? 'video/webm' : 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error(uploadError)
        URL.revokeObjectURL(previewUrl)
        alert('Erro ao enviar arquivo.')
        return
      }

      const { data: publicData } = supabase.storage
        .from('inspections')
        .getPublicUrl(filePath)

      const fileUrl = publicData.publicUrl

      await supabase
        .from('inspection_media')
        .delete()
        .eq('session_id', session.id)
        .eq('item_id', currentItem.id)

      const { error: insertError } = await supabase.from('inspection_media').insert([
        {
          session_id: session.id,
          item_id: currentItem.id,
          file_url: fileUrl,
          file_path: filePath,
          media_type: currentItem.type,
          captured_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error(insertError)
        URL.revokeObjectURL(previewUrl)
        alert('Erro ao salvar mídia.')
        return
      }

      setCapturedMedia((prev) => ({
        ...prev,
        [currentItem.id]: {
          fileUrl,
          previewUrl,
          filePath,
          mediaType: currentItem.type,
        },
      }))

      setCapturing(false)
    } catch (error) {
      console.error(error)
      alert('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const goToNextStep = () => {
    if (!currentItemCompleted) {
      alert('Capture a mídia antes de avançar.')
      return
    }

    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1)
      setCapturing(false)
    }
  }

  const finishInspection = async () => {
    if (!currentSession) {
      alert('Inicie a vistoria capturando pelo menos uma mídia.')
      return
    }

    const requiredItems = items.filter((item) => item.required)
    const missingRequired = requiredItems.some((item) => !capturedMedia[item.id])

    if (missingRequired) {
      alert('Ainda existem etapas obrigatórias sem captura.')
      return
    }

    const { error } = await supabase
      .from('inspection_sessions')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id)

    if (error) {
      console.error(error)
      alert('Erro ao finalizar vistoria.')
      return
    }

    alert('Vistoria finalizada com sucesso!')
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Nova vistoria</h1>
          <p className="text-sm text-slate-600">
            Registre as fotos do veículo por etapa no MoviCar.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow">
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="mb-4 w-full rounded border p-3"
          >
            <option value="">Selecione veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span>
                Etapa {items.length > 0 ? currentStepIndex + 1 : 0} de {items.length}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 rounded bg-slate-200">
              <div
                className="h-2 rounded bg-emerald-600"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {currentItem && (
            <div className="rounded-xl bg-slate-50 p-4">
              <h2 className="mb-2 text-lg font-bold">{currentItem.name}</h2>

              {capturing ? (
                <CameraCapture
                  type={currentItem.type}
                  onCapture={handleCapture}
                />
              ) : !currentItemCompleted ? (
                <>
                  <button
                    onClick={() => setCapturing(true)}
                    disabled={!selectedVehicle || loading}
                    className="w-full rounded bg-emerald-600 py-3 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {currentItem.type === 'video' ? 'Gravar vídeo' : 'Capturar foto'}
                  </button>

                  {!selectedVehicle && (
                    <p className="mt-2 text-sm text-amber-700">
                      Selecione um veículo para continuar.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {capturedMedia[currentItem.id].mediaType === 'photo' ? (
                    <img
                      src={capturedMedia[currentItem.id].previewUrl}
                      alt={currentItem.name}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <video
                      src={capturedMedia[currentItem.id].previewUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCapturing(true)}
                      className="flex-1 rounded bg-amber-500 py-2 text-white"
                    >
                      Refazer
                    </button>

                    {isLastStep ? (
                      <button
                        onClick={finishInspection}
                        className="flex-1 rounded bg-emerald-700 py-2 text-white"
                      >
                        Finalizar
                      </button>
                    ) : (
                      <button
                        onClick={goToNextStep}
                        className="flex-1 rounded bg-emerald-700 py-2 text-white"
                      >
                        Próxima
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <p className="mt-3 text-sm text-slate-600">Processando...</p>
          )}
        </div>
      </div>
    </div>
  )
}