import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { db, schema } from '@contextos/db'

export type AccessLogEntry = {
  id: string
  createdAt: Date
  endpoint: string
  apiKeyId: string | null
  apiKeyName: string | null
  statusCode: number
  tokensEstimated: number
  durationMs: number
  blocksIncluded: number
}

export type ListLogsFilter = {
  workspaceId: string
  hours?: number
  limit?: number
  endpoint?: string
  apiKeyId?: string
  statusGte?: number
  statusLt?: number
}

export async function listAccessLogsForWorkspace(
  params: ListLogsFilter
): Promise<AccessLogEntry[]> {
  const since = new Date(Date.now() - (params.hours ?? 24) * 60 * 60 * 1000)
  const conditions = [
    eq(schema.executionTraces.workspaceId, params.workspaceId),
    gte(schema.executionTraces.createdAt, since)
  ]
  if (params.endpoint) {
    conditions.push(eq(schema.executionTraces.endpoint, params.endpoint))
  }
  if (params.apiKeyId) {
    conditions.push(eq(schema.executionTraces.apiKeyId, params.apiKeyId))
  }
  if (params.statusGte !== undefined) {
    conditions.push(gte(schema.executionTraces.statusCode, params.statusGte))
  }
  if (params.statusLt !== undefined) {
    conditions.push(lt(schema.executionTraces.statusCode, params.statusLt))
  }

  const rows = await db
    .select({
      id: schema.executionTraces.id,
      createdAt: schema.executionTraces.createdAt,
      endpoint: schema.executionTraces.endpoint,
      apiKeyId: schema.executionTraces.apiKeyId,
      apiKeyName: schema.apiKeys.name,
      statusCode: schema.executionTraces.statusCode,
      tokensEstimated: schema.executionTraces.tokensEstimated,
      durationMs: schema.executionTraces.durationMs,
      blocksIncluded: schema.executionTraces.blocksIncluded
    })
    .from(schema.executionTraces)
    .leftJoin(schema.apiKeys, eq(schema.apiKeys.id, schema.executionTraces.apiKeyId))
    .where(and(...conditions))
    .orderBy(desc(schema.executionTraces.createdAt))
    .limit(params.limit ?? 100)
  return rows
}

export function logsToCsv(logs: AccessLogEntry[]): string {
  const header =
    'created_at,endpoint,api_key,status_code,blocks_included,tokens_estimated,duration_ms,trace_id'
  const rows = logs.map((l) =>
    [
      new Date(l.createdAt).toISOString(),
      l.endpoint,
      l.apiKeyName ?? 'session',
      l.statusCode,
      l.blocksIncluded,
      l.tokensEstimated,
      l.durationMs,
      l.id
    ].join(',')
  )
  return [header, ...rows].join('\n')
}
