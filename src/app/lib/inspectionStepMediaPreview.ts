import { supabase } from '@/app/lib/supabaseClient'

const TTL_MS = 50 * 60 * 1000

type CacheEntry = { signedUrl: string; expiresAtMs: number }

const store = new Map<string, CacheEntry>()

function cacheKey(sessionId: string, itemId: string) {
  return `${sessionId}\0${itemId}`
}

export function getCachedInspectionMediaSignedUrl(
  sessionId: string,
  itemId: string
): string | null {
  const k = cacheKey(sessionId, itemId)
  const e = store.get(k)
  if (!e) return null
  if (Date.now() > e.expiresAtMs) {
    store.delete(k)
    return null
  }
  return e.signedUrl
}

function setCachedInspectionMediaSignedUrl(
  sessionId: string,
  itemId: string,
  signedUrl: string
) {
  store.set(cacheKey(sessionId, itemId), {
    signedUrl,
    expiresAtMs: Date.now() + TTL_MS,
  })
}

export function invalidateInspectionStepMediaPreview(
  sessionId: string,
  itemId: string
) {
  store.delete(cacheKey(sessionId, itemId))
}

export type InspectionStepMediaPreviewResult = {
  signedUrl: string | null
  error: 'db' | 'signed' | null
}

/**
 * Mesmas consultas de antes (inspection_media + createSignedUrl), com cache em memória
 * para voltar à etapa ou prefetch da próxima sem repetir rede.
 */
export async function loadInspectionStepMediaPreview(
  sessionId: string,
  itemId: string
): Promise<InspectionStepMediaPreviewResult> {
  const cached = getCachedInspectionMediaSignedUrl(sessionId, itemId)
  if (cached) {
    return { signedUrl: cached, error: null }
  }

  const { data, error } = await supabase
    .from('inspection_media')
    .select('id, file_path, file_url')
    .eq('session_id', sessionId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar mídia:', error)
    return { signedUrl: null, error: 'db' }
  }

  const storedPath = data?.file_path || data?.file_url
  if (!storedPath) {
    return { signedUrl: null, error: null }
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from('inspections')
    .createSignedUrl(storedPath, 60 * 60)

  if (signedError || !signedData?.signedUrl) {
    if (signedError) {
      console.error('Erro ao gerar signed URL no fetch:', signedError)
    }
    return { signedUrl: null, error: 'signed' }
  }

  setCachedInspectionMediaSignedUrl(sessionId, itemId, signedData.signedUrl)
  return { signedUrl: signedData.signedUrl, error: null }
}
