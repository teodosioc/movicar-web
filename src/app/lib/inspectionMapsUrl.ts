/**
 * URL do mapa para as coordenadas já registradas na vistoria (nenhuma nova
 * coleta de localização do visualizador). Usada como href de link nativo —
 * window.open com features abre como popup e é bloqueado silenciosamente
 * em navegadores móveis (retorna null), por isso não é usado aqui.
 */
export function buildInspectionMapsUrl(
  latitude: number,
  longitude: number
): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}
