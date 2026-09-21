import { supabase } from "@/app/lib/supabaseClient"

export type InspectionHistoryPeriod = "all" | "month" | "30d" | "custom"

export type InspectionHistoryFilters = {
  search: string
  period: InspectionHistoryPeriod
  /** yyyy-mm-dd (fuso local), usado quando period === "custom" */
  customFrom: string
  /** yyyy-mm-dd (fuso local), usado quando period === "custom" */
  customTo: string
  status: string
  sort: "desc" | "asc"
  page: number
  perPage: number
}

export type InspectionHistoryVehicle = {
  id: string
  plate: string
  model: string | null
  brand: string | null
  year: string | null
}

export type InspectionHistoryRow = {
  id: string
  vehicle_id: string
  driver_name: string | null
  status: string
  odometer: number | null
  latitude: number | null
  longitude: number | null
  started_at: string | null
  finished_at: string | null
  created_at: string | null
  vehicles?: InspectionHistoryVehicle | InspectionHistoryVehicle[] | null
}

export type InspectionHistoryResult = {
  rows: InspectionHistoryRow[]
  total: number
}

/**
 * Intervalo [início, fim) em UTC correspondente ao período escolhido no fuso
 * local do usuário. O último dia do intervalo personalizado é incluído por
 * inteiro (fim = dia seguinte à meia-noite local).
 */
function buildPeriodRange(
  filters: InspectionHistoryFilters
): { from: string | null; to: string | null } {
  const now = new Date()

  if (filters.period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString(), to: null }
  }

  if (filters.period === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString(), to: null }
  }

  if (filters.period === "custom") {
    let from: string | null = null
    let to: string | null = null

    if (filters.customFrom) {
      const [y, m, d] = filters.customFrom.split("-").map(Number)
      if (y && m && d) from = new Date(y, m - 1, d).toISOString()
    }

    if (filters.customTo) {
      const [y, m, d] = filters.customTo.split("-").map(Number)
      if (y && m && d) to = new Date(y, m - 1, d + 1).toISOString()
    }

    return { from, to }
  }

  return { from: null, to: null }
}

/** Remove caracteres com significado especial na sintaxe de filtros do PostgREST. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%_\\"']/g, "").trim()
}

/**
 * Busca uma página do histórico de vistorias no servidor, com filtros de
 * busca (placa ou motorista), período e status. Ordenação estável por
 * created_at com desempate por id, e contagem total real para a paginação.
 */
export async function fetchInspectionHistory(
  filters: InspectionHistoryFilters
): Promise<InspectionHistoryResult> {
  const term = sanitizeSearchTerm(filters.search)

  let matchedVehicleIds: string[] | null = null
  if (term) {
    const { data: vehicleMatches, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id")
      .ilike("plate", `%${term}%`)

    if (vehiclesError) throw vehiclesError
    matchedVehicleIds = (vehicleMatches ?? []).map((v) => v.id)
  }

  let query = supabase
    .from("inspections")
    .select(
      `
        id,
        vehicle_id,
        driver_name,
        status,
        odometer,
        latitude,
        longitude,
        started_at,
        finished_at,
        created_at,
        vehicles (
          id,
          plate,
          model,
          brand,
          year
        )
      `,
      { count: "exact" }
    )

  if (term) {
    const conditions = [`driver_name.ilike.%${term}%`]
    if (matchedVehicleIds && matchedVehicleIds.length > 0) {
      conditions.push(`vehicle_id.in.(${matchedVehicleIds.join(",")})`)
    }
    query = query.or(conditions.join(","))
  }

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  const range = buildPeriodRange(filters)
  if (range.from) query = query.gte("created_at", range.from)
  if (range.to) query = query.lt("created_at", range.to)

  const ascending = filters.sort === "asc"
  const fromIndex = (filters.page - 1) * filters.perPage
  const toIndex = fromIndex + filters.perPage - 1

  const { data, error, count } = await query
    .order("created_at", { ascending })
    .order("id", { ascending })
    .range(fromIndex, toIndex)

  if (error) throw error

  return {
    rows: (data ?? []) as InspectionHistoryRow[],
    total: count ?? 0,
  }
}

export type OdometerHistoryRow = {
  id: string
  vehicle_id: string
  odometer: number
  finished_at: string | null
  created_at: string | null
}

const ODOMETER_HISTORY_CHUNK = 1000

/**
 * Histórico completo de odômetro dos veículos informados, paginado em blocos
 * para não ser truncado pelo limite de linhas por resposta do PostgREST
 * (padrão 1000). Ordenação determinística (created_at, id) garante blocos
 * sem repetição nem omissão.
 */
export async function fetchOdometerHistoryForVehicles(
  vehicleIds: string[]
): Promise<OdometerHistoryRow[]> {
  if (vehicleIds.length === 0) return []

  const rows: OdometerHistoryRow[] = []
  let offset = 0

  for (;;) {
    const { data, error } = await supabase
      .from("inspections")
      .select("id, vehicle_id, odometer, finished_at, created_at")
      .in("vehicle_id", vehicleIds)
      .not("odometer", "is", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + ODOMETER_HISTORY_CHUNK - 1)

    if (error) throw error

    const chunk = (data ?? []) as OdometerHistoryRow[]
    rows.push(...chunk)

    if (chunk.length < ODOMETER_HISTORY_CHUNK) break
    offset += ODOMETER_HISTORY_CHUNK
  }

  return rows
}

/** Total de vistorias criadas hoje (fuso local), independente dos filtros do histórico. */
export async function countInspectionsToday(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const { count, error } = await supabase
    .from("inspections")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())

  if (error) throw error
  return count ?? 0
}
