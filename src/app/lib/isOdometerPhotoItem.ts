/** Matches the odometer / speedometer photo step in inspection_items (name or id). */
export function isOdometerPhotoItem(item: { id: string; name: string }): boolean {
  const normalizedName = item.name.toLowerCase()
  const normalizedId = item.id.toLowerCase()

  return (
    normalizedName.includes('quilometragem') ||
    normalizedName.includes('velocimetro') ||
    normalizedName.includes('velocímetro') ||
    normalizedId.includes('quilometragem') ||
    normalizedId.includes('velocimetro')
  )
}
