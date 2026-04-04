'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import InspectionStep from '@/app/components/InspectionStep'

type InspectionItem = {
  id: string
  name: string
  type: 'photo' | 'video'
  required: boolean
  order_index: number
}

type Vehicle = {
  id: string
  plate: string
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

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    setStepCompleted(false)
  }, [currentIndex])

  useEffect(() => {
    if (!selectedVehicle) {
      setSessionId(null)
      setCurrentIndex(0)
      setStepCompleted(false)
      return
    }

    if (sessionId || creatingSession) return

    createSession(selectedVehicle)
  }, [selectedVehicle])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      const [{ data: itemsData, error: itemsError }, { data: vehiclesData, error: vehiclesError }] =
        await Promise.all([
          supabase.from('inspection_items').select('*').order('order_index'),
          supabase.from('vehicles').select('*').order('plate'),
        ])

      if (itemsError) throw itemsError
      if (vehiclesError) throw vehiclesError

      setItems(itemsData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error(error)
      alert('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (vehicleId: string) => {
    try {
      setCreatingSession(true)

      const { data, error } = await supabase
        .from('inspection_sessions')
        .insert([
          {
            vehicle_id: vehicleId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
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
  }

  const handleStepCompleted = useCallback((completed: boolean) => {
    setStepCompleted(completed)
  }, [])

  const handleNext = () => {
    if (!stepCompleted) {
      alert('Capture a mídia antes de continuar.')
      return
    }

    setCurrentIndex((prev) => Math.min(prev + 1, items.length - 1))
  }

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleFinish = async () => {
    if (!sessionId) return

    if (!stepCompleted) {
      alert('Capture a mídia antes de finalizar.')
      return
    }

    const { error } = await supabase
      .from('inspection_sessions')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error(error)
      alert('Erro ao finalizar vistoria.')
      return
    }

    alert('Vistoria finalizada com sucesso!')
    router.push('/dashboard')
  }

  const progress = useMemo(() => {
    if (items.length === 0) return 0
    return Math.round(((currentIndex + 1) / items.length) * 100)
  }, [currentIndex, items.length])

  if (loading) {
    return <p className="p-4">Carregando...</p>
  }

  if (!items.length) {
    return <p className="p-4">Nenhum item encontrado.</p>
  }

  const currentItem = items[currentIndex]
  const isLast = currentIndex === items.length - 1

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
                    Etapa {currentIndex + 1} de {items.length}
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
                ) : (
                  <InspectionStep
                    key={currentItem.id}
                    sessionId={sessionId}
                    item={currentItem}
                    onCompleted={handleStepCompleted}
                  />
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className="flex-1 rounded-2xl bg-slate-300 py-2 font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Voltar
                </button>

                {isLast ? (
                  <button
                    onClick={handleFinish}
                    disabled={!stepCompleted}
                    className="flex-1 rounded-2xl bg-emerald-700 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Finalizar
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!stepCompleted}
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