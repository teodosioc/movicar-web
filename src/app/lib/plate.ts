/** Placa sem hífen, espaços ou pontuação, em maiúsculas (ex.: "abc-1d23" → "ABC1D23"). */
export function normalizePlate(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
}

/** Formatos aceitos: antigo (ABC1234) e Mercosul (ABC1D23). */
export function isValidPlate(normalized: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalized);
}
