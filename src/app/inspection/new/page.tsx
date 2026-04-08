'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import InspectionStep from '@/app/components/InspectionStep'
import OdometerStep from '@/app/components/OdometerStep'
import { isOdometerPhotoItem } from '@/app/lib/isOdometerPhotoItem'
import { isValidOdometerKm } from '@/app/lib/odometerKm'

type InspectionItem = {
  id: string
  name: string
  type: 'photo' | 'video'
  required: boolean
  order_index: number
}

type WizardStep =
  | { kind: 'media'; item: InspectionItem }
  | { kind: 'odometer' }

type Vehicle = {
  id: string
  plate: string
  inspection_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
}

type MoviCarUser = {
  id?: string
  name?: string
  email?: string
  role?: string
  active?: boolean
}

type GeoData = {
  latitude: number | null
  longitude: number | null
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
  const [odometerKm, setOdometerKm] = useState('')

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
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude ?? null,
            longitude: position.coords.longitude ?? null,
          })
        },
        () => {
          resolve({
            latitude: null,
            longitude: null,
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

  const calculateNextInspectionDue = (
    baseDateIso: string,
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  ) => {
    if (!frequency) return null

    const baseDate = new Date(baseDateIso)
    if (Number.isNaN(baseDate.getTime())) return null

    const nextDate = new Date(baseDate)

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 15)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      default:
        return null
    }

    return nextDate.toISOString()
  }

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)

      const loggedUser = getLoggedUser()

      if (!loggedUser?.id) {
        throw new Error('Usuário não encontrado')
      }

      const itemsPromise = supabase
        .from('inspection_items')
        .select('*')
        .order('order_index')

      const baseVehiclesQuery = supabase
        .from('vehicles')
        .select('id, plate, inspection_frequency')

      const vehiclesPromise =
        loggedUser.role === 'admin'
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

      setItems(itemsData || [])
      setVehicles(vehiclesData || [])

      if (vehiclesData && vehiclesData.length === 1) {
        setSelectedVehicle(vehiclesData[0].id)
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSession = useCallback(async (vehicleId: string) => {
    try {
      setCreatingSession(true)

      const loggedUser = getLoggedUser()
      const geoData = await getGeoData()

      const { data, error } = await supabase
        .from('inspection_sessions')
        .insert([
          {
            vehicle_id: vehicleId,
            driver_id: loggedUser?.id ?? null,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            latitude: geoData.latitude,
            longitude: geoData.longitude,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setSessionId(data.id)
    } catch (error) {
      console.error(error)
      alert('Erro ao criar sessão.')
    } finally {
      setCreatingSession(false)
    }
  }, [])

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

    if (sessionId || creatingSession) return

    createSession(selectedVehicle)
  }, [selectedVehicle, sessionId, creatingSession, createSession])

  const handleStepCompleted = useCallback((completed: boolean) => {
    setStepCompleted(completed)
  }, [])

  const wizardSteps = useMemo((): WizardStep[] => {
    const out: WizardStep[] = []
    for (const item of items) {
      out.push({ kind: 'media', item })
      if (isOdometerPhotoItem(item)) {
        out.push({ kind: 'odometer' })
      }
    }
    return out
  }, [items])

  const currentWizardStep = wizardSteps[currentIndex]

  useEffect(() => {
    if (!currentWizardStep || currentWizardStep.kind !== 'odometer') return
    setStepCompleted(isValidOdometerKm(odometerKm))
  }, [currentIndex, currentWizardStep, odometerKm])

  const handleNext = () => {
    if (!stepCompleted) {
      if (currentWizardStep?.kind === 'odometer') {
        alert('Informe a quilometragem antes de continuar.')
      } else {
        alert('Capture a mídia antes de continuar.')
      }
      return
    }

    setCurrentIndex((prev) => Math.min(prev + 1, wizardSteps.length - 1))
  }

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleFinish = async () => {
    if (!sessionId || !selectedVehicle || finishing) return

    if (!stepCompleted) {
      if (currentWizardStep?.kind === 'odometer') {
        alert('Informe a quilometragem antes de finalizar.')
      } else {
        alert('Capture a mídia antes de finalizar.')
      }
      return
    }

    try {
      setFinishing(true)

      const finishedAt = new Date().toISOString()
      const loggedUser = getLoggedUser()
      const fallbackGeo = await getGeoData()

      const { error: sessionUpdateError } = await supabase
        .from('inspection_sessions')
        .update({
          status: 'completed',
          finished_at: finishedAt,
          latitude: fallbackGeo.latitude,
          longitude: fallbackGeo.longitude,
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

      const odometerValue = isValidOdometerKm(odometerKm)
        ? Number.parseInt(odometerKm, 10)
        : null

      const { data: inspectionData, error: inspectionInsertError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: sessionData.vehicle_id,
          created_by: loggedUser?.id ?? sessionData.driver_id ?? null,
          driver_name: loggedUser?.name ?? null,
          status: 'completed',
          odometer: odometerValue,
          notes: null,
          latitude: sessionData.latitude ?? fallbackGeo.latitude,
          longitude: sessionData.longitude ?? fallbackGeo.longitude,
          address: null,
          started_at: sessionData.started_at,
          finished_at: sessionData.finished_at ?? finishedAt,
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

      const selectedVehicleData =
        vehicles.find((vehicle) => vehicle.id === selectedVehicle) ?? null

      const nextInspectionDue = calculateNextInspectionDue(
        finishedAt,
        selectedVehicleData?.inspection_frequency ?? null
      )

      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({
          last_inspection_at: finishedAt,
          next_inspection_due: nextInspectionDue,
        })
        .eq('id', selectedVehicle)

      if (vehicleUpdateError) {
        throw vehicleUpdateError
      }

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
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('movicar_token')
              localStorage.removeItem('movicar_user_email')
              localStorage.removeItem('movicar_user')
              document.cookie = 'movicar_token=; path=/; max-age=0; samesite=lax'
              router.push('/login')
              router.refresh()
            }}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sair
          </button>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow ring-1 ring-slate-200 sm:p-5">
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 outline-none"
          >
            <option value="">Selecione veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>

          {!selectedVehicle && (
            <p className="text-sm text-slate-500">
              Selecione um veículo para iniciar a vistoria.
            </p>
          )}

          {selectedVehicle && (
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
                    key={currentWizardStep.item.id}
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
                  Voltar
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
                    disabled={!stepCompleted || finishing}
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