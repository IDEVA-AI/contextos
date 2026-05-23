import pino from 'pino'

let cached: pino.Logger | null = null

export function getLogger(): pino.Logger {
  if (cached) return cached
  cached = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: 'contextos-web' },
    timestamp: pino.stdTimeFunctions.isoTime
  })
  return cached
}

export function logRequest(params: {
  endpoint: string
  apiKeyId?: string
  userId?: string
  statusCode: number
  durationMs: number
  meta?: Record<string, unknown>
}) {
  const log = getLogger()
  const fn = params.statusCode >= 500 ? 'error' : params.statusCode >= 400 ? 'warn' : 'info'
  log[fn](
    {
      endpoint: params.endpoint,
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      status: params.statusCode,
      duration_ms: params.durationMs,
      ...params.meta
    },
    `${params.endpoint} ${params.statusCode} ${params.durationMs}ms`
  )
}
