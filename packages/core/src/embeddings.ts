import OpenAI from 'openai'

export const EMBEDDING_DIMENSIONS = 1536

export type EmbeddingProvider = 'openai' | 'none'

function getProvider(): EmbeddingProvider {
  const raw = (process.env.EMBEDDING_PROVIDER ?? 'openai').toLowerCase()
  if (raw === 'none' || raw === 'off' || raw === 'disabled') return 'none'
  if (!process.env.OPENAI_API_KEY) return 'none'
  return 'openai'
}

let cached: OpenAI | null = null
function client(): OpenAI {
  if (cached) return cached
  cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return cached
}

/**
 * Gera embeddings em batch. Retorna array de vectors (mesma ordem do input)
 * ou null em cada slot se provider=none (modo offline).
 */
export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (texts.length === 0) return []
  const provider = getProvider()
  if (provider === 'none') {
    return texts.map(() => null)
  }

  const model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'
  const result = await client().embeddings.create({
    model,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS
  })
  return result.data.map((item) => item.embedding)
}

export function isEmbeddingsEnabled(): boolean {
  return getProvider() !== 'none'
}
