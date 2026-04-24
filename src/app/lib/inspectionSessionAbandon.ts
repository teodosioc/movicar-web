const DEFAULT_ABANDON_HOURS = 24

/**
 * Prazo máximo para reutilizar uma sessão aberta, a partir de `started_at`.
 * Configure com `NEXT_PUBLIC_MOVICAR_INSPECTION_SESSION_ABANDON_HOURS` (número decimal, ex.: 24 ou 48).
 */
export function getInspectionSessionAbandonMaxMs(): number {
  const raw = process.env.NEXT_PUBLIC_MOVICAR_INSPECTION_SESSION_ABANDON_HOURS
  if (raw === undefined || raw === '') {
    return DEFAULT_ABANDON_HOURS * 60 * 60 * 1000
  }
  const hours = Number.parseFloat(raw)
  if (!Number.isFinite(hours) || hours <= 0) {
    return DEFAULT_ABANDON_HOURS * 60 * 60 * 1000
  }
  return hours * 60 * 60 * 1000
}

export function isOpenInspectionSessionStale(
  startedAt: string | null
): boolean {
  if (!startedAt) return false
  const ageMs = Date.now() - new Date(startedAt).getTime()
  if (!Number.isFinite(ageMs) || ageMs < 0) return false
  return ageMs > getInspectionSessionAbandonMaxMs()
}
