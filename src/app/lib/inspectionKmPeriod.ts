export type InspectionOdometerHistoryRow = {
  id: string
  vehicle_id: string
  odometer: number
  finished_at: string | null
  created_at: string | null
}

function inspectionSortKey(row: InspectionOdometerHistoryRow): number {
  const t = row.finished_at || row.created_at
  if (!t) return 0
  const ms = new Date(t).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * Quilometragem entre esta vistoria e a anterior do mesmo veículo (odômetro atual − anterior),
 * ordenando por data (finished_at, senão created_at). Primeira vistoria com odômetro: null.
 */
export function buildKmTraveledByInspectionId(
  rows: InspectionOdometerHistoryRow[]
): Record<string, number | null> {
  const byVehicle = new Map<string, InspectionOdometerHistoryRow[]>()
  for (const row of rows) {
    const arr = byVehicle.get(row.vehicle_id) ?? []
    arr.push(row)
    byVehicle.set(row.vehicle_id, arr)
  }

  const out: Record<string, number | null> = {}

  for (const list of byVehicle.values()) {
    list.sort((a, b) => {
      const ka = inspectionSortKey(a)
      const kb = inspectionSortKey(b)
      if (ka !== kb) return ka - kb
      return a.id.localeCompare(b.id)
    })
    for (let i = 0; i < list.length; i++) {
      if (i === 0) {
        out[list[i].id] = null
      } else {
        const delta = list[i].odometer - list[i - 1].odometer
        out[list[i].id] = delta >= 0 ? delta : null
      }
    }
  }

  return out
}
