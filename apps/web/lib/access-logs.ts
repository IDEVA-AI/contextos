import { and, desc, eq, gte } from 'drizzle-orm'
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

export async function listAccessLogsForWorkspace(params: {
  workspaceId: string
  hours?: number
  limit?: number
}): Promise<AccessLogEntry[]> {
  const since = new Date(Date.now() - (params.hours ?? 24) * 60 * 60 * 1000)
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
    .where(
      and(
        eq(schema.executionTraces.workspaceId, params.workspaceId),
        gte(schema.executionTraces.createdAt, since)
      )
    )
    .orderBy(desc(schema.executionTraces.createdAt))
    .limit(params.limit ?? 100)
  return rows
}
