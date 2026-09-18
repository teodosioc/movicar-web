import { isOdometerPhotoItem } from '@/app/lib/isOdometerPhotoItem'

/**
 * Imagens de exemplo das etapas da vistoria (WebP com hash de conteúdo no nome).
 * Ao trocar uma imagem, gere um novo arquivo com hash novo e atualize aqui —
 * o cache imutável configurado em next.config.ts depende da URL mudar.
 * Os PNGs originais permanecem em public/examples como fonte.
 */
export const INSPECTION_EXAMPLE_IMAGES = {
  frente: '/examples/foto-frente.5b0ab5d3.webp',
  traseira: '/examples/foto-traseira.4aa44205.webp',
  lateralDireita: '/examples/lateral-direita.82ad28ca.webp',
  lateralEsquerda: '/examples/lateral-esquerda.9215416f.webp',
  quilometragem: '/examples/quilometragem-velocimetro.6b142c95.webp',
} as const

/** Mesmo mapeamento por nome/id de item usado na exibição da etapa. */
export function getInspectionExampleImage(item: {
  id: string
  name: string
}): string | null {
  const normalizedName = item.name.toLowerCase()
  const normalizedId = item.id.toLowerCase()

  if (normalizedName.includes('frente') || normalizedId.includes('frente')) {
    return INSPECTION_EXAMPLE_IMAGES.frente
  }

  if (normalizedName.includes('traseira') || normalizedId.includes('traseira')) {
    return INSPECTION_EXAMPLE_IMAGES.traseira
  }

  if (
    normalizedName.includes('lateral direita') ||
    normalizedName.includes('direita') ||
    normalizedId.includes('direita')
  ) {
    return INSPECTION_EXAMPLE_IMAGES.lateralDireita
  }

  if (
    normalizedName.includes('lateral esquerda') ||
    normalizedName.includes('esquerda') ||
    normalizedId.includes('esquerda')
  ) {
    return INSPECTION_EXAMPLE_IMAGES.lateralEsquerda
  }

  if (isOdometerPhotoItem(item)) {
    return INSPECTION_EXAMPLE_IMAGES.quilometragem
  }

  return null
}
