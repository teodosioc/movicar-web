'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import { resolveMoviCarUserFromAuth, signOutMoviCar } from '@/app/lib/movicarAuth'
import InspectionStep from '@/app/components/InspectionStep'
import OdometerStep from '@/app/components/OdometerStep'
import { isValidOdometerKm } from '@/app/lib/odometerKm'
import {
  buildWizardSteps,
  computeResumeWizardIndex,
  type InspectionWizardItem,
} from '@/app/lib/inspectionWizard'
import { loadInspectionStepMediaPreview } from '@/app/lib/inspectionStepMediaPreview'
import { getInspectionExampleImage } from '@/app/lib/inspectionExampleImage'
import {
  ensureOpenInspectionSession,
  persistSessionOdometer,
} from '@/app/lib/services/inspectionSessions'
import { toValidGeoPair } from '@/app/lib/geoCoordinates'
import {
  companyViewLabel,
  resolveCompanyView,
  type CompanyView,
} from '@/app/lib/companyView'
import {
  INSPECTION_TYPE_LABELS,
  isInspectionType,
  type InspectionType,
} from '@/app/lib/inspectionType'

type InspectionItem = InspectionWizardItem

type Vehicle = {
  id: string
  plate: string
  inspection_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  /** Campos da loja; só são consultados na visão de loja. */
  brand?: string | null
  model?: string | null
  operation_type?: string | null
}

const INSPECTION_TYPE_OPTIONS = Object.keys(
  INSPECTION_TYPE_LABELS
) as InspectionType[]

type MoviCarUser = {
  id?: string
  name?: string
  email?: string
  role?: string
  active?: boolean
}

type GeoFailureReason =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'unsupported'

type GeoData = {
  latitude: number | null
  longitude: number | null
  /** Preenchido quando a coleta falhou; coordenadas ficam nulas nesse caso. */
  errorReason: GeoFailureReason | null
}

function mapGeoErrorReason(code: number | undefined): GeoFailureReason {
  switch (code) {
    case 1:
      return 'permission_denied'
    case 3:
      return 'timeout'
    default:
      return 'position_unavailable'
  }
}

export default function NewInspectionPage() {
  const router = useRouter()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stepCompleted, setStepCompleted] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [savingOdometer, setSavingOdometer] = useState(false)
  const [odometerKm, setOdometerKm] = useState('')
  const [view, setView] = useState<CompanyView | null>(null)
  const [inspectionType, setInspectionType] = useState<InspectionType | ''>('')

  // Loja: a vistoria tem tipo (entrada, saída...). Locadora segue sem tipo.
  const isStore = view?.company.company_type === 'vehicle_store'

  useEffect(() => {
    setStepCompleted(false)
  }, [currentIndex])

  const getLoggedUser = (): MoviCarUser | null => {
    try {
      const raw = localStorage.getItem('movicar_user')
      if (!raw) return null
      return JSON.parse(raw)
    } catch (error) {
      console.error('Erro ao ler usuário logado:', error)
      return null
    }
  }

  const getGeoData = async (): Promise<GeoData> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        latitude: null,
        longitude: null,
        errorReason: 'unsupported',
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude ?? null,
            longitude: position.coords.longitude ?? null,
            errorReason: null,
          })
        },
        (error) => {
          resolve({
            latitude: null,
            longitude: null,
            errorReason: mapGeoErrorReason(error?.code),
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

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)

      const resolved = await resolveMoviCarUserFromAuth()
      if (!resolved?.id) {
        router.replace('/login')
        return
      }

      const loggedUser: MoviCarUser = {
        id: resolved.id,
        name: resolved.name,
        email: resolved.email,
        role: resolved.role,
        active: resolved.active,
      }

      // Empresa em exibição: a do próprio usuário ou, para o admin, a visão
      // escolhida no dashboard. Checklist e veículos seguem essa empresa.
      const companyView = await resolveCompanyView({
        id: resolved.id,
        role: String(resolved.role ?? ''),
      })
      const storeView = companyView.company.company_type === 'vehicle_store'
      setView(companyView)

      const itemsPromise = supabase
        .from('inspection_items')
        .select('*')
        .eq('company_type', companyView.company.company_type)
        .order('order_index')

      const baseVehiclesQuery = supabase
        .from('vehicles')
        .select(
          storeView
            ? 'id, plate, inspection_frequency, brand, model, operation_type'
            : 'id, plate, inspection_frequency'
        )
        .eq('company_id', companyView.company.id)

      const isManager =
        loggedUser.role === 'admin' || loggedUser.role === 'lojista'

      const vehiclesPromise = isManager
        ? baseVehiclesQuery.eq('active', true).order('plate')
        : baseVehiclesQuery
            .eq('assigned_user_id', loggedUser.id)
            .eq('active', true)
            .order('plate')

      const [
        { data: itemsData, error: itemsError },
        { data: vehiclesData, error: vehiclesError },
      ] = await Promise.all([itemsPromise, vehiclesPromise])

      if (itemsError) throw itemsError
      if (vehiclesError) throw vehiclesError

      const vehicleRows = (vehiclesData ?? []) as unknown as Vehicle[]

      setItems(itemsData || [])
      setVehicles(vehicleRows)

      // Veículo e tipo podem vir do dashboard (cadastro ou lista de veículos).
      const params = new URLSearchParams(window.location.search)
      const requestedVehicle = params.get('vehicle')
      const requestedType = params.get('type')

      if (requestedVehicle && vehicleRows.some((v) => v.id === requestedVehicle)) {
        setSelectedVehicle(requestedVehicle)
      } else if (vehicleRows.length === 1) {
        setSelectedVehicle(vehicleRows[0].id)
      }

      if (storeView && isInspectionType(requestedType)) {
        setInspectionType(requestedType)
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [router])

  const getOrCreateSession = useCallback(
    async (vehicleId: string, orderedItems: InspectionItem[]) => {
      try {
        setCreatingSession(true)

        const [loggedUser, geoData] = await Promise.all([
          resolveMoviCarUserFromAuth(),
          getGeoData(),
        ])

        const userId = loggedUser?.id ?? null

        if (!userId) {
          throw new Error('Usuário não identificado para iniciar a sessão.')
        }

        // Grava só par completo e válido; par parcial/inválido vira ausência.
        const startPair = toValidGeoPair(geoData.latitude, geoData.longitude)
        if (!startPair) {
          console.warn(
            '[geo] coleta inicial sem posição válida:',
            geoData.errorReason ?? 'invalid_pair'
          )
        }

        const session = await ensureOpenInspectionSession({
          vehicleId,
          driverId: userId,
          latitude: startPair?.latitude ?? null,
          longitude: startPair?.longitude ?? null,
        })

        const { data: mediaRows, error: mediaError } = await supabase
          .from('inspection_media')
          .select('item_id')
          .eq('session_id', session.id)

        if (mediaError) throw mediaError

        const itemIdsWithMedia = new Set(
          (mediaRows ?? [])
            .map((row) => row.item_id as string | null | undefined)
            .filter((id): id is string => Boolean(id))
        )

        const persistedOdometer =
          session.odometer != null && session.odometer > 0
            ? String(session.odometer)
            : ''

        const steps = buildWizardSteps(orderedItems)
        const resumeIndex = computeResumeWizardIndex(
          steps,
          itemIdsWithMedia,
          isValidOdometerKm(persistedOdometer)
        )

        setOdometerKm(persistedOdometer)
        setSessionId(session.id)
        setCurrentIndex(resumeIndex)
      } catch (error) {
        console.error(error)
        alert('Erro ao iniciar vistoria.')
      } finally {
        setCreatingSession(false)
      }
    },
    []
  )

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (!selectedVehicle) {
      setSessionId(null)
      setCurrentIndex(0)
      setStepCompleted(false)
      setOdometerKm('')
      return
    }

    if (!items.length) return

    // Na loja, a vistoria só começa depois de escolhido o tipo.
    if (isStore && !inspectionType) return

    if (sessionId || creatingSession) return

    void getOrCreateSession(selectedVehicle, items)
  }, [
    selectedVehicle,
    items,
    sessionId,
    creatingSession,
    getOrCreateSession,
    isStore,
    inspectionType,
  ])

  const selectedVehicleRow = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicle) ?? null,
    [vehicles, selectedVehicle]
  )

  // Devolução de consignado só vale para veículo consignado.
  const availableInspectionTypes = useMemo(
    () =>
      INSPECTION_TYPE_OPTIONS.filter(
        (type) =>
          type !== 'consignment_return' ||
          selectedVehicleRow?.operation_type === 'consigned'
      ),
    [selectedVehicleRow]
  )

  useEffect(() => {
    if (
      inspectionType &&
      selectedVehicleRow &&
      !availableInspectionTypes.includes(inspectionType)
    ) {
      setInspectionType('')
    }
  }, [inspectionType, selectedVehicleRow, availableInspectionTypes])

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    setSessionId(null)
    setCurrentIndex(0)
    setStepCompleted(false)
    setOdometerKm('')
  }

  const handleStepCompleted = useCallback((completed: boolean) => {
    setStepCompleted(completed)
  }, [])

  const wizardSteps = useMemo(() => buildWizardSteps(items), [items])

  const currentWizardStep = wizardSteps[currentIndex]

  useEffect(() => {
    if (!currentWizardStep || currentWizardStep.kind !== 'odometer') return
    setStepCompleted(isValidOdometerKm(odometerKm))
  }, [currentIndex, currentWizardStep, odometerKm])

  useEffect(() => {
    if (!sessionId || creatingSession || !wizardSteps.length) return

    const nextIndex = currentIndex + 1
    if (nextIndex >= wizardSteps.length) return

    const step = wizardSteps[nextIndex]
    if (step.kind !== 'media') return

    // Pré-carrega só o exemplo da próxima etapa, em prioridade baixa (a imagem
    // da etapa atual usa fetchPriority="high"). Mesma URL da exibição — o
    // navegador reaproveita o cache e não baixa duas vezes.
    const nextExample = getInspectionExampleImage(step.item)
    if (nextExample && typeof window !== 'undefined') {
      const img = new window.Image()
      img.fetchPriority = 'low'
      img.src = nextExample
    }

    void loadInspectionStepMediaPreview(sessionId, step.item.id).catch(() => {
      /* prefetch best-effort */
    })
  }, [sessionId, currentIndex, wizardSteps, creatingSession])

  const handleNext = async () => {
    if (!stepCompleted) {
      if (currentWizardStep?.kind === 'odometer') {
        alert('Informe a quilometragem antes de continuar.')
      } else {
        alert('Capture a mídia antes de continuar.')
      }
      return
    }

    if (currentWizardStep?.kind === 'odometer' && sessionId) {
      if (!isValidOdometerKm(odometerKm)) {
        alert('Informe a quilometragem antes de continuar.')
        return
      }

      try {
        setSavingOdometer(true)
        await persistSessionOdometer(sessionId, Number.parseInt(odometerKm, 10))
      } catch (error) {
        console.error(error)
        alert('Erro ao salvar quilometragem. Tente novamente.')
        return
      } finally {
        setSavingOdometer(false)
      }
    }

    setCurrentIndex((prev) => Math.min(prev + 1, wizardSteps.length - 1))
  }

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleFinish = async () => {
    if (!sessionId || !selectedVehicle || finishing) return

    if (isStore && !inspectionType) {
      alert('Selecione o tipo da vistoria antes de finalizar.')
      return
    }

    if (!stepCompleted) {
      if (currentWizardStep?.kind === 'odometer') {
        alert('Informe a quilometragem antes de finalizar.')
      } else {
        alert('Capture a mídia antes de finalizar.')
      }
      return
    }

    const odometerStepIndex = wizardSteps.findIndex((s) => s.kind === 'odometer')
    if (odometerStepIndex >= 0 && !isValidOdometerKm(odometerKm)) {
      alert('Informe a quilometragem antes de finalizar.')
      setCurrentIndex(odometerStepIndex)
      return
    }

    try {
      setFinishing(true)

      const finishedAt = new Date().toISOString()
      const loggedUser = getLoggedUser()
      const fallbackGeo = await getGeoData()

      const odometerValue = isValidOdometerKm(odometerKm)
        ? Number.parseInt(odometerKm, 10)
        : null

      // Coleta final: só sobrescreve a posição da sessão com um par completo
      // e válido. Falha (permissão/timeout/indisponível) ou par inválido
      // preservam as coordenadas já gravadas no início da sessão.
      const finalPair = toValidGeoPair(fallbackGeo.latitude, fallbackGeo.longitude)
      const finalFailureReason = finalPair
        ? null
        : (fallbackGeo.errorReason ?? 'invalid_pair')

      if (finalFailureReason) {
        console.warn('[geo] coleta final sem posição válida:', finalFailureReason)
      }

      const { error: sessionUpdateError } = await supabase
        .from('inspection_sessions')
        .update({
          status: 'completed',
          finished_at: finishedAt,
          odometer: odometerValue,
          ...(finalPair
            ? { latitude: finalPair.latitude, longitude: finalPair.longitude }
            : {}),
        })
        .eq('id', sessionId)

      if (sessionUpdateError) {
        throw sessionUpdateError
      }

      const { data: sessionData, error: sessionFetchError } = await supabase
        .from('inspection_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionFetchError) {
        throw sessionFetchError
      }

      // Par usado na vistoria: coleta final válida tem precedência; sem ela,
      // preserva-se o par já existente na sessão (posição do início). Pares
      // nunca são combinados entre coletas; sem posição válida, fica ausente.
      const sessionPair = toValidGeoPair(sessionData.latitude, sessionData.longitude)
      const inspectionPair = finalPair ?? sessionPair

      // Diagnóstico persistido (consultável em inspections.notes); sem
      // coordenadas nem dados pessoais. Distingue a posição preservada do
      // início de uma coleta final bem-sucedida.
      const geoNotes = finalFailureReason
        ? inspectionPair
          ? `geo: coleta final falhou (${finalFailureReason}); preservada a posição do início da sessão`
          : `geo: sem posição válida no início nem na finalização (final: ${finalFailureReason})`
        : null

      const { data: inspectionData, error: inspectionInsertError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: sessionData.vehicle_id,
          created_by: loggedUser?.id ?? sessionData.driver_id ?? null,
          driver_name: loggedUser?.name ?? null,
          status: 'completed',
          odometer: odometerValue,
          notes: geoNotes,
          latitude: inspectionPair?.latitude ?? null,
          longitude: inspectionPair?.longitude ?? null,
          address: null,
          started_at: sessionData.started_at,
          finished_at: sessionData.finished_at ?? finishedAt,
          ...(isStore && inspectionType
            ? { inspection_type: inspectionType }
            : {}),
        })
        .select('id')
        .single()

      if (inspectionInsertError) {
        throw inspectionInsertError
      }

      const inspectionId = inspectionData.id

      const { error: mediaUpdateError } = await supabase
        .from('inspection_media')
        .update({
          inspection_id: inspectionId,
        })
        .eq('session_id', sessionId)

      if (mediaUpdateError) {
        throw mediaUpdateError
      }

      setSelectedVehicle('')
      setSessionId(null)
      setOdometerKm('')
      setInspectionType('')
      alert('Vistoria finalizada com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      alert('Erro ao finalizar vistoria.')
    } finally {
      setFinishing(false)
    }
  }

  const progress = useMemo(() => {
    if (wizardSteps.length === 0) return 0
    return Math.round(((currentIndex + 1) / wizardSteps.length) * 100)
  }, [currentIndex, wizardSteps.length])

  if (loading) {
    return <p className="p-4">Carregando...</p>
  }

  if (!items.length) {
    return <p className="p-4">Nenhum item encontrado.</p>
  }

  const isLast = currentIndex === wizardSteps.length - 1

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nova vistoria</h1>
            <p className="text-sm text-slate-600">
              Registre as mídias do veículo por etapa no MoviCar.
            </p>
            {view?.canSwitch ? (
              <p className="mt-1 text-sm font-medium text-slate-700">
                {companyViewLabel(view.company)}
              </p>
            ) : null}
          </div>

          <button
            onClick={() => {
              void signOutMoviCar().then(() => {
                document.cookie = 'movicar_token=; path=/; max-age=0; samesite=lax'
                router.push('/login')
                router.refresh()
              })
            }}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sair
          </button>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow ring-1 ring-slate-200 sm:p-5">
          <select
            value={selectedVehicle}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 outline-none"
          >
            <option value="">Selecione veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {[v.plate, [v.brand, v.model].filter(Boolean).join(' ')]
                  .filter(Boolean)
                  .join(' · ')}
              </option>
            ))}
          </select>

          {!selectedVehicle && (
            <p className="text-sm text-slate-500">
              Selecione um veículo para iniciar a vistoria.
            </p>
          )}

          {isStore && selectedVehicle && (
            <fieldset className="mb-4">
              <legend className="text-sm font-medium text-slate-700">
                Tipo da vistoria <span className="text-red-500">*</span>
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {availableInspectionTypes.map((type) => {
                  const isActive = inspectionType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setInspectionType(type)}
                      disabled={finishing}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isActive
                          ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {INSPECTION_TYPE_LABELS[type]}
                    </button>
                  )
                })}
              </div>
              {!inspectionType && (
                <p className="mt-2 text-sm text-slate-500">
                  Selecione o tipo da vistoria para começar.
                </p>
              )}
            </fieldset>
          )}

          {selectedVehicle && (!isStore || inspectionType) && (
            <>
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-sm text-slate-700">
                  <span>
                    Etapa {currentIndex + 1} de {wizardSteps.length}
                  </span>
                  <span>{progress}%</span>
                </div>

                <div className="h-2 rounded bg-slate-200">
                  <div
                    className="h-2 rounded bg-emerald-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
                {!sessionId || creatingSession ? (
                  <p className="text-sm text-slate-600">Preparando vistoria...</p>
                ) : currentWizardStep?.kind === 'media' ? (
                  <InspectionStep
                    key={`${sessionId}-${currentWizardStep.item.id}`}
                    sessionId={sessionId}
                    item={currentWizardStep.item}
                    onCompleted={handleStepCompleted}
                  />
                ) : currentWizardStep?.kind === 'odometer' ? (
                  <OdometerStep value={odometerKm} onChange={setOdometerKm} />
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleBack}
                  disabled={currentIndex === 0 || finishing}
                  className="flex-1 rounded-2xl bg-slate-300 py-2 font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Etapa anterior
                </button>

                {isLast ? (
                  <button
                    onClick={handleFinish}
                    disabled={!stepCompleted || finishing}
                    className="flex-1 rounded-2xl bg-emerald-700 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {finishing ? 'Finalizando...' : 'Finalizar'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!stepCompleted || finishing || savingOdometer}
                    className="flex-1 rounded-2xl bg-emerald-700 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Próximo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}