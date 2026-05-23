import { createHash } from 'node:crypto'
import IORedis from 'ioredis'
import type { CompileInput } from './compiler'

const TTL_SECONDS = 5 * 60 // 5 minutos

let cached: IORedis | null = null
function getRedis(): IORedis {
  if (cached) return cached
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL is required')
  cached = new IORedis(url, { maxRetriesPerRequest: null })
  return cached
}

export function makeCacheKey(input: CompileInput): string {
  const normalized = {
    wsId: input.workspaceId,
    brainId: input.brainId ?? null,
    contextVersion: input.contextVersion ?? 'latest',
    scope: (input.scope ?? []).slice().sort(),
    task: input.task ?? null,
    query: input.query,
    format: input.format,
    budget: input.budgetTokens ?? null,
    includeExamples: input.includeExamples ?? true,
    apiKeyScopes: (input.apiKeyScopes ?? []).slice().sort()
  }
  const hash = createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
  return `compile:${hash.slice(0, 32)}`
}

export async function getCachedPackage<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedPackage(key: string, value: unknown): Promise<void> {
  try {
    await getRedis().setex(key, TTL_SECONDS, JSON.stringify(value))
  } catch {
    // Cache não bloqueia compilation se Redis cair
  }
}
