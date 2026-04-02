'use client'

import { useEffect, useMemo, useState } from 'react'
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

type StepKey =
  | 'frente'
  | 'traseira'
  | 'lateral_direita'
  | 'lateral_esquerda'
  | 'quilometragem'
  | 'video_360'

type OrderedInspectionStep = InspectionItem & {
  stepKey: StepKey
}

const STEP_ORDER: StepKey[] = [
  'frente',
  'traseira',
  'lateral_direita',
  'lateral_esquerda',
  'quilometragem',
  'video_360',
]

const STEP_META: Record<
  StepKey,
  {
    title: string
    instruction: string
    buttonLabel: string
    exampleHint: string
    type: 'photo' | 'video'
  }
> = {
  frente: {
    title: 'Frente do veículo',
    instruction: 'Fotografe a frente do veículo com a placa visível.',
    buttonLabel: 'Capturar foto da frente',
    exampleHint: 'Mostre a frente completa do carro.',
    type: 'photo',
  },
  traseira: {
    title: 'Traseira do veículo',
    instruction: 'Fotografe a traseira do veículo com a placa visível.',
    buttonLabel: 'Capturar foto da traseira',
    exampleHint: 'Mostre a traseira completa do carro.',
    type: 'photo',
  },
  lateral_direita: {
    title: 'Lateral direita',
    instruction: 'Fotografe a lateral direita completa do veículo.',
    buttonLabel: 'Capturar foto da lateral direita',
    exampleHint: 'Mostre toda a lateral direita do carro.',
    type: 'photo',
  },
  lateral_esquerda: {
    title: 'Lateral esquerda',
    instruction: 'Fotografe a lateral esquerda completa do veículo.',
    buttonLabel: 'Capturar foto da lateral esquerda',
    exampleHint: 'Mostre toda a lateral esquerda do carro.',
    type: 'photo',
  },
  quilometragem: {
    title: 'Painel / Quilometragem',
    instruction: 'Fotografe o painel com a quilometragem visível.',
    buttonLabel: 'Capturar foto do painel',
    exampleHint: 'A quilometragem precisa estar legível.',
    type: 'photo',
  },
  video_360: {
    title: 'Vídeo 360',
    instruction: 'Grave um vídeo 360° ao redor do veículo.',
    buttonLabel: 'Gravar vídeo 360',
    exampleHint: 'Última etapa da vistoria.',
    type: 'video',
  },
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function identifyStepKey(item: InspectionItem): StepKey | null {
  const name = normalizeText(item.name)
  const instructions = normalizeText(item.instructions || '')
  const content = `${name} ${instructions}`

  if (item.type === 'video') {
    return 'video_360'
  }

  if (
    content.includes('quilometragem') ||
    content.includes('hodometro') ||
    content.includes('painel')
  ) {
    return 'quilometragem'
  }

  if (content.includes('lateral direita') || content.includes('lado direito')) {
    return 'lateral_direita'
  }

  if (content.includes('lateral esquerda') || content.includes('lado esquerdo')) {
    return 'lateral_esquerda'
  }

  if (content.includes('traseira')) {
    return 'traseira'
  }

  if (content.includes('frente') || content.includes('dianteira')) {
    return 'frente'
  }

  return null
}

export default function NewInspectionPage() {
  const router = useRouter()

  const [items, setItems] = useState<InspectionItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [currentSession, setCurrentSession] = useState<InspectionSession | null>(null)

  const [userEmail, setUserEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const [completedItems, setCompletedItems] = useState<string[]>([])

  const [activeItem, setActiveItem] = useState<OrderedInspectionStep | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

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

  const orderedItems = useMemo<OrderedInspectionStep[]>(() => {
    const mapped = items
      .map((item) => {
        const stepKey = identifyStepKey(item)
        if (!stepKey) return null

        return {
          ...item,
          stepKey,
        }
      })
      .filter((item): item is OrderedInspectionStep => item !== null)

    const uniqueByStep = new Map<StepKey, OrderedInspectionStep>()

    for (const item of mapped) {
      if (!uniqueByStep.has(item.stepKey)) {
        uniqueByStep.set(item.stepKey, item)
      }
    }

    return STEP_ORDER.map((stepKey) => uniqueByStep.get(stepKey)).filter(
      (item): item is OrderedInspectionStep => Boolean(item)
    )
  }, [items])

  useEffect(() => {
    if (loading) return

    const missingSteps = STEP_ORDER.filter(
      (stepKey) => !orderedItems.some((item) => item.stepKey === stepKey)
    )

    if (missingSteps.length > 0) {
      const missingTitles = missingSteps.map((step) => STEP_META[step].title).join(', ')
      setPageError(
        `Os seguintes itens estão faltando na tabela inspection_items: ${missingTitles}. Cadastre esses itens para continuar.`
      )
    }
  }, [loading, orderedItems])

  const currentItem = orderedItems[currentStepIndex]
  const totalSteps = orderedItems.length
  const completedCount = orderedItems.filter((item) =>
    completedItems.includes(item.id)
  ).length
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const currentMeta = currentItem ? STEP_META[currentItem.stepKey] : null
  const isCurrentCompleted = currentItem
    ? completedItems.includes(currentItem.id)
    : false
  const isCurrentUploading = currentItem
    ? uploadingItemId === currentItem.id
    : false

  const resetCaptureState = () => {
    setCameraOpen(false)
    setActiveItem(null)
    setUploadingItemId(null)
  }

  const resetInspectionFlow = () => {
    setCurrentSession(null)
    setCompletedItems([])
    setCurrentStepIndex(0)
    resetCaptureState()
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

  const goToNextStep = () => {
    if (!isCurrentCompleted) return

    setCurrentStepIndex((prev) => {
      if (prev >= totalSteps - 1) return prev
      return prev + 1
    })
  }

  const goToPreviousStep = () => {
    setCurrentStepIndex((prev) => {
      if (prev <= 0) return 0
      return prev - 1
    })
  }

  const handleStartPhoto = async (item: OrderedInspectionStep) => {
    const session = await createSession()
    if (!session) return

    setActiveItem(item)
    setCameraOpen(true)
  }

  const handleStartVideo = async (item: OrderedInspectionStep) => {
    const session = await createSession()
    if (!session) return

    setActiveItem(item)
    alert('A captura do vídeo 360 será implementada no próximo passo.')
  }

  const handleCapturedPhoto = async (file: File) => {
    try {
      if (!activeItem || !currentSession) return

      const itemToSave = activeItem

      setUploadingItemId(itemToSave.id)
      setCameraOpen(false)
      setActiveItem(null)

      const capturedAt = new Date().toISOString()
      const location = await getLocation()
      const fileExtension = file.name.split('.').pop() || 'jpg'

      const filePath =
        currentSession.id +
        '/' +
        itemToSave.id +
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

      const { data } = supabase.storage.from('inspections').getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('inspection_media').insert([
        {
          session_id: currentSession.id,
          item_id: itemToSave.id,
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
        prev.includes(itemToSave.id) ? prev : [...prev, itemToSave.id]
      )

      const savedStepIndex = orderedItems.findIndex((item) => item.id === itemToSave.id)

      if (savedStepIndex >= 0 && savedStepIndex < totalSteps - 1) {
        setCurrentStepIndex(savedStepIndex + 1)
      }

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

  if (!currentItem || !currentMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Nenhum item encontrado</h1>
          <p className="mt-3 text-slate-700">
            Não foi possível montar o fluxo da vistoria com os itens atuais.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
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
              resetInspectionFlow()
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

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Etapa {currentStepIndex + 1} de {totalSteps}
              </p>
              <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                {currentMeta.title}
              </h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {completedCount}/{totalSteps} concluídos
            </span>
          </div>

          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-700">
                    {currentStepIndex + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {currentItem.name}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {currentMeta.instruction}
                </p>

                <p className="mt-2 text-sm text-slate-500">{currentMeta.exampleHint}</p>

                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tipo: {currentMeta.type === 'photo' ? 'Foto' : 'Vídeo curto (até 30s)'}
                </p>
              </div>

              {isCurrentCompleted && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Concluído
                </span>
              )}
            </div>

            {!cameraOpen && (
              <div className="mt-6">
                {currentMeta.type === 'photo' ? (
                  <button
                    type="button"
                    onClick={() => handleStartPhoto(currentItem)}
                    disabled={!selectedVehicle || isCurrentUploading || isCurrentCompleted}
                    className={`w-full rounded-2xl px-4 py-4 text-base font-semibold text-white ${
                      isCurrentCompleted
                        ? 'cursor-not-allowed bg-blue-600'
                        : isCurrentUploading
                          ? 'cursor-not-allowed bg-amber-500'
                          : selectedVehicle
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'cursor-not-allowed bg-slate-400'
                    }`}
                  >
                    {isCurrentCompleted
                      ? 'Foto enviada'
                      : isCurrentUploading
                        ? 'Enviando...'
                        : currentMeta.buttonLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartVideo(currentItem)}
                    disabled={!selectedVehicle}
                    className={`w-full rounded-2xl px-4 py-4 text-base font-semibold text-white ${
                      selectedVehicle
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'cursor-not-allowed bg-slate-400'
                    }`}
                  >
                    {currentMeta.buttonLabel}
                  </button>
                )}
              </div>
            )}

            {cameraOpen && activeItem && activeItem.id === currentItem.id ? (
              <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0 || cameraOpen}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                disabled={
                  currentStepIndex === totalSteps - 1 || cameraOpen || !isCurrentCompleted
                }
                className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima etapa
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">
            Resumo das etapas
          </h2>

          <div className="mt-4 grid gap-3">
            {orderedItems.map((item, index) => {
              const done = completedItems.includes(item.id)
              const isCurrent = index === currentStepIndex

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isCurrent
                      ? 'border-slate-900 bg-slate-50'
                      : done
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
                          done
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {STEP_META[item.stepKey].title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {STEP_META[item.stepKey].type === 'photo'
                            ? 'Foto'
                            : 'Vídeo curto (até 30s)'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        done
                          ? 'bg-emerald-100 text-emerald-700'
                          : isCurrent
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {done ? 'Concluído' : isCurrent ? 'Atual' : 'Pendente'}
                    </span>
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