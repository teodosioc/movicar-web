import { supabase } from '../supabaseClient'
import { isOpenInspectionSessionStale } from '../inspectionSessionAbandon'

type EnsureOpenSessionParams = {
  vehicleId: string
  driverId: string
  latitude?: number | null
  longitude?: number | null
}

type OpenSessionRow = {
  id: string
  started_at: string | null
  status: string | null
}

async function fetchLatestOpenSession(
  vehicleId: string,
  driverId: string
): Promise<{ data: OpenSessionRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('inspection_sessions')
    .select('id, started_at, status')
    .eq('vehicle_id', vehicleId)
    .eq('driver_id', driverId)
    .is('finished_at', null)
    .not('status', 'eq', 'completed')
    .not('status', 'eq', 'cancelled')
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return { data: (data ?? []) as OpenSessionRow[], error: null }
}

async function markSessionAbandoned(sessionId: string): Promise<void> {
  const finishedAt = new Date().toISOString()
  const { error } = await supabase
    .from('inspection_sessions')
    .update({
      status: 'abandoned',
      finished_at: finishedAt,
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Erro ao marcar sessão como abandoned:', error)
    throw new Error(`Erro ao encerrar sessão antiga: ${error.message}`)
  }
}

async function insertNewSession(params: EnsureOpenSessionParams) {
  const { vehicleId, driverId, latitude = null, longitude = null } = params
  return supabase
    .from('inspection_sessions')
    .insert({
      vehicle_id: vehicleId,
      driver_id: driverId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      latitude,
      longitude,
    })
    .select('id')
    .single()
}

/**
 * Busca sessão aberta (finished_at nulo, não completed/cancelled) ou cria uma nova.
 * Sessão aberta com started_at fora do prazo configurável é marcada abandoned + finished_at e substituída por nova sessão.
 * Em concorrência, o índice único parcial pode falhar o insert; nesse caso refaz a leitura.
 */
export async function ensureOpenInspectionSession(
  params: EnsureOpenSessionParams
): Promise<{ id: string }> {
  const maxAttempts = 5

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: rows, error: fetchError } = await fetchLatestOpenSession(
      params.vehicleId,
      params.driverId
    )

    if (fetchError) {
      console.error('Erro Supabase (sessão existente):', fetchError)
      throw new Error(`Erro ao buscar sessão: ${fetchError.message}`)
    }

    const existing = rows?.[0] ?? null

    if (existing?.id) {
      if (!isOpenInspectionSessionStale(existing.started_at)) {
        return { id: existing.id }
      }

      await markSessionAbandoned(existing.id)
      continue
    }

    const { data, error } = await insertNewSession(params)

    if (!error && data?.id) {
      return { id: data.id }
    }

    if (error?.code === '23505') {
      continue
    }

    console.error('Erro Supabase:', error)
    throw new Error(`Erro ao iniciar vistoria: ${error?.message ?? 'desconhecido'}`)
  }

  throw new Error(
    'Não foi possível obter ou criar sessão de vistoria após várias tentativas.'
  )
}
