export type GeoPair = { latitude: number; longitude: number }

/**
 * Retorna o par de coordenadas quando latitude E longitude são números
 * finitos dentro das faixas geográficas; senão, null. Zero é válido.
 * Um par parcial ou inválido nunca deve ser gravado — e latitude de uma
 * coleta nunca deve ser combinada com longitude de outra.
 */
export function toValidGeoPair(
  latitude: unknown,
  longitude: unknown
): GeoPair | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  if (latitude < -90 || latitude > 90) {
    return null
  }
  if (longitude < -180 || longitude > 180) {
    return null
  }
  return { latitude, longitude }
}
