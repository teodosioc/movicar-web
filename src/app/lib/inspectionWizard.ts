import { isOdometerPhotoItem } from '@/app/lib/isOdometerPhotoItem'

export type InspectionWizardItem = {
  id: string
  name: string
  type: 'photo' | 'video'
  required: boolean
  order_index: number
}

export type WizardStep =
  | { kind: 'media'; item: InspectionWizardItem }
  | { kind: 'odometer' }

export function buildWizardSteps(items: InspectionWizardItem[]): WizardStep[] {
  const out: WizardStep[] = []
  for (const item of items) {
    out.push({ kind: 'media', item })
    if (isOdometerPhotoItem(item)) {
      out.push({ kind: 'odometer' })
    }
  }
  return out
}

/**
 * Primeira etapa pendente: mídia exige registro em inspection_media; etapa de
 * odômetro não é persistida — usa heurística (mídia de item com order maior)
 * para não voltar atrás quando já houve progresso linear.
 */
export function computeResumeWizardIndex(
  wizardSteps: WizardStep[],
  itemIdsWithMedia: Set<string>,
  orderedItems: InspectionWizardItem[]
): number {
  if (wizardSteps.length === 0) return 0

  const hasLaterMediaForItem = (afterItem: InspectionWizardItem) =>
    orderedItems.some(
      (it) =>
        it.order_index > afterItem.order_index && itemIdsWithMedia.has(it.id)
    )

  for (let i = 0; i < wizardSteps.length; i++) {
    const step = wizardSteps[i]
    if (step.kind === 'media') {
      if (!itemIdsWithMedia.has(step.item.id)) return i
      continue
    }

    const prevMedia = [...wizardSteps.slice(0, i)]
      .reverse()
      .find((s): s is { kind: 'media'; item: InspectionWizardItem } => s.kind === 'media')

    if (!prevMedia) return i

    if (!hasLaterMediaForItem(prevMedia.item)) return i
  }

  return wizardSteps.length - 1
}
