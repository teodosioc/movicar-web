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
 * odômetro exige KM persistido na sessão (inspection_sessions.odometer).
 */
export function computeResumeWizardIndex(
  wizardSteps: WizardStep[],
  itemIdsWithMedia: Set<string>,
  hasPersistedOdometer: boolean
): number {
  if (wizardSteps.length === 0) return 0

  for (let i = 0; i < wizardSteps.length; i++) {
    const step = wizardSteps[i]
    if (step.kind === 'media') {
      if (!itemIdsWithMedia.has(step.item.id)) return i
      continue
    }

    if (!hasPersistedOdometer) return i
  }

  return wizardSteps.length - 1
}
