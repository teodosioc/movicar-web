'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import CameraCapture from '../../components/CameraCapture'

type InspectionItem = {
  id: string
  name: string
  type: string
  order_index: number
  instructions: string
}

type Vehicle = {
  id: string
  plate: string
  model: string
}

type InspectionSession = {
  id: string
  vehicle_id: string
  driver_id: string | null
  status: string
}

export default function NewInspectionPage() {
  const router = useRouter()

  const [items, setItems] = useState<InspectionItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [currentSession, setCurrentSession] = useState<InspectionSession | null>(null)

  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const [completedItems, setCompletedItems] = useState<string[]>([])

  const [activeItem, setActiveItem] = useState<InspectionItem | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setPageError('')

        const token = localStorage.getItem('movicar_token')
        const savedEmail = localStorage.getItem('movicar_user_email') || ''

        if (!token) {
          router.push('/login')
          return
        }

        setUserEmail(savedEmail)

        const localUserId = savedEmail || 'local-user'
        setUserId(localUserId)

        const { data: itemsData, error: itemsError } = await supabase
          .from('inspection_items')
          .select('*')
          .order('order_index')

        if (itemsError) {
          console.error(itemsError)
          setPageError('Erro ao carregar os itens do checklist.')
          return
        }

        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('plate')

        if (vehiclesError) {
          console.error(vehiclesError)
          setPageError('Erro ao carregar os veículos.')
          return
        }

        setItems(itemsData || [])
        setVehicles(vehiclesData || [])
      } catch (error) {
        console.error(error)
        setPageError('Erro inesperado ao carregar a vistoria.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const resetCaptureState = () => {
    setCameraOpen(false)
    setActiveItem(null)
    setUploadingItemId(null)
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
          driver_id: null,
          status: 'draft',
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

  const getLocation = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })

  const handleStartPhoto = async (item: InspectionItem) => {
    const session = await createSession()
    if (!session) return

    setActiveItem(item)
    setCameraOpen(true)
  }

  const handleStartVideo = async (item: InspectionItem) => {
    const session = await createSession()
    if (!session) return

    setActiveItem(item)
    alert('O vídeo 360 será implementado no próximo passo.')
  }

  const handleCapturedPhoto = async (file: File) => {
    try {
      if (!activeItem || !currentSession) return

      setUploadingItemId(activeItem.id)
      setCameraOpen(false)
      setActiveItem(null)

      const capturedAt = new Date().toISOString()
      const location = await getLocation()
      const fileExtension = file.name.split('.').pop() || 'jpg'

      const filePath =
        currentSession.id +
        '/' +
        activeItem.id +
        '/' +
        Date.now() +
        '.' +
        fileExtension

      const { error: uploadError } = await supabase.storage
        .from('inspections')
        .upload(filePath, file)

      if (uploadError) {
        console.error(uploadError)
        alert('Erro no upload da foto.')
        return
      }

      const { data } = supabase.storage
        .from('inspections')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('inspection_media')
        .insert([
          {
            session_id: currentSession.id,
            item_id: activeItem.id,
            file_url: data.publicUrl,
            file_path: filePath,
            media_type: 'photo',
            captured_at: capturedAt,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            location_accuracy: location.coords.accuracy,
            created_by: null,
          },
        ])

      if (dbError) {
        console.error(dbError)
        alert('Erro ao salvar no banco.')
        return
      }

      setCompletedItems((prev) =>
        prev.includes(activeItem.id) ? prev : [...prev, activeItem.id]
      )

      alert('Foto enviada com sucesso!')
    } catch (error) {
      console.error(error)
      alert('Erro geral ao capturar ou enviar foto.')
    } finally {
      setUploadingItemId(null)
    }
  }

  const handleCloseCamera = () => {
    setCameraOpen(false)
    setActiveItem(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-medium text-slate-700">Carregando vistoria...</p>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-red-600">Erro ao abrir vistoria</h1>
          <p className="mt-3 text-slate-700">{pageError}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-2xl bg-slate-800 px-4 py-3 font-medium text-white hover:bg-slate-900"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Nova vistoria
              </h1>
              <p className="mt-2 text-sm text-slate-700">
                Usuário logado:{' '}
                <span className="font-medium text-slate-900">{userEmail}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-900 md:w-auto"
            >
              Voltar ao dashboard
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Selecione o veículo
          </label>

          <select
            value={selectedVehicle}
            onChange={(e) => {
              setSelectedVehicle(e.target.value)
              setCurrentSession(null)
              setCompletedItems([])
              resetCaptureState()
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Selecione</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} - {v.model}
              </option>
            ))}
          </select>

          {!selectedVehicle && (
            <p className="mt-2 text-sm text-amber-600">
              Selecione um veículo para habilitar a vistoria.
            </p>
          )}

          {currentSession && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-base font-semibold text-emerald-800">
                Sessão de vistoria iniciada com sucesso
              </p>
              <p className="mt-1 break-all text-sm text-emerald-900">
                ID da sessão: {currentSession.id}
              </p>
            </div>
          )}
        </div>

        {cameraOpen && activeItem ? (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <p className="mb-4 text-base text-slate-700">
              Capturando foto para:{' '}
              <span className="font-semibold text-slate-900">{activeItem.name}</span>
            </p>

            <CameraCapture
              key={activeItem.id}
              onCapture={handleCapturedPhoto}
              onClose={handleCloseCamera}
            />
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">
              Checklist do MVP
            </h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {completedItems.length}/{items.length} concluídos
            </span>
          </div>

          <div className="grid gap-4">
            {items.map((item) => {
              const isCompleted = completedItems.includes(item.id)
              const isUploading = uploadingItemId === item.id
              const isPhoto = item.type === 'photo'
              const isDisabledPhoto = !selectedVehicle || isUploading || isCompleted
              const isDisabledVideo = !selectedVehicle

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">
                          {item.order_index}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.name}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.instructions}
                      </p>

                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Tipo: {isPhoto ? 'Foto' : 'Vídeo curto (até 30s)'}
                      </p>
                    </div>

                    <div className="md:shrink-0">
                      {isPhoto ? (
                        <button
                          type="button"
                          onClick={() => handleStartPhoto(item)}
                          disabled={isDisabledPhoto}
                          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white md:w-40 ${
                            isCompleted
                              ? 'cursor-not-allowed bg-blue-600'
                              : isUploading
                                ? 'cursor-not-allowed bg-amber-500'
                                : selectedVehicle
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'cursor-not-allowed bg-slate-400'
                          }`}
                        >
                          {isCompleted
                            ? 'Foto enviada'
                            : isUploading
                              ? 'Enviando...'
                              : 'Capturar foto'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartVideo(item)}
                          disabled={isDisabledVideo}
                          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white md:w-40 ${
                            selectedVehicle
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : 'cursor-not-allowed bg-slate-400'
                          }`}
                        >
                          Gravar vídeo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}