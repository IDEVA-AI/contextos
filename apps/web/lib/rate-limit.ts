import IORedis from 'ioredis'

let cached: IORedis | null = null
function getRedis(): IORedis {
  if (cached) return cached
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL is required')
  cached = new IORedis(url, { maxRetriesPerRequest: null })
  return cached
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number // unix ms
}

/**
 * Token bucket simples em Redis. Janela fixa de 60s.
 * key = `ratelimit:${scope}:${id}:${minuteBucket}`
 */
export async function checkRateLimit(params: {
  scope: 'api_key' | 'ip'
  identifier: string
  limit?: number
  windowSeconds?: number
}): Promise<RateLimitResult> {
  const limit = params.limit ?? 100
  const window = params.windowSeconds ?? 60
  const bucket = Math.floor(Date.now() / 1000 / window)
  const key = `ratelimit:${params.scope}:${params.identifier}:${bucket}`
  const resetAt = (bucket + 1) * window * 1000

  try {
    const r = getRedis()
    const pipeline = r.multi()
    pipeline.incr(key)
    pipeline.expire(key, window + 5)
    const results = await pipeline.exec()
    if (!results) throw new Error('pipeline_failed')
    const count = results[0]?.[1] as number
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt
    }
  } catch {
    // Se Redis cair, fail open (não bloqueia)
    return { allowed: true, remaining: limit, resetAt }
  }
}
