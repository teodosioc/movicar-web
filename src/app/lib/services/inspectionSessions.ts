import { supabase } from '../supabaseClient'

type StartInspectionSessionParams = {
  vehicleId: string
  driverId: string
  latitude?: number | null
  longitude?: number | null
}

export async function startInspectionSession({
  vehicleId,
  driverId,
  latitude = null,
  longitude = null,
}: StartInspectionSessionParams) {
  const { data, error } = await supabase
    .from('inspection_sessions')
    .insert({
      vehicle_id: vehicleId,
      driver_id: driverId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      latitude,
      longitude,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro Supabase:', error)

    throw new Error(`Erro ao iniciar vistoria: ${error.message}`)
  }

  return data
}