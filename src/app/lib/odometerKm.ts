export const ODOMETER_MAX_KM = 1_000_000

/** Raw digits only, capped at {@link ODOMETER_MAX_KM}. */
export function parseOdometerKmInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  const n = Number.parseInt(digits, 10)
  if (!Number.isFinite(n)) return ''
  return String(Math.min(n, ODOMETER_MAX_KM))
}

export function formatOdometerKmPtBr(digits: string): string {
  if (digits === '') return ''
  const n = Number.parseInt(digits, 10)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR')
}

export function isValidOdometerKm(digits: string): boolean {
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) && n > 0 && n <= ODOMETER_MAX_KM
}
