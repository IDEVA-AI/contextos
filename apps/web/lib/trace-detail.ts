import { and, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'

export type TraceDetail = {
  id: string
  workspaceId: string
  brainId: string | null
  brainVersionId: string | null
  apiKeyId: string | null
  apiKeyName: string | null
  endpoint: string
  requestPayload: unknown
  blocksConsidered: number
  blocksIncluded: number
  blocksExcluded: number
  tokensEstimated: number
  warnings: string[]
  statusCode: number
  durationMs: number
  createdAt: Date
}

export async function getTraceForUser(params: {
  traceId: string
  userId: string
}): Promise<TraceDetail | null> {
  const [row] = await db
    .select({
      trace: schema.executionTraces,
      ownerId: schema.workspaces.ownerId,
      apiKeyName: schema.apiKeys.name
    })
    .from(schema.executionTraces)
    .innerJoin(
      schema.workspaces,
      eq(schema.workspaces.id, schema.executionTraces.workspaceId)
    )
    .leftJoin(
      schema.apiKeys,
      eq(schema.apiKeys.id, schema.executionTraces.apiKeyId)
    )
    .where(
      and(
        eq(schema.executionTraces.id, params.traceId),
        eq(schema.workspaces.ownerId, params.userId)
      )
    )
    .limit(1)

  if (!row) return null

  return {
    id: row.trace.id,
    workspaceId: row.trace.workspaceId,
    brainId: row.trace.brainId,
    brainVersionId: row.trace.brainVersionId,
    apiKeyId: row.trace.apiKeyId,
    apiKeyName: row.apiKeyName,
    endpoint: row.trace.endpoint,
    requestPayload: row.trace.requestPayload,
    blocksConsidered: row.trace.blocksConsidered,
    blocksIncluded: row.trace.blocksIncluded,
    blocksExcluded: row.trace.blocksExcluded,
    tokensEstimated: row.trace.tokensEstimated,
    warnings: row.trace.warnings,
    statusCode: row.trace.statusCode,
    durationMs: row.trace.durationMs,
    createdAt: row.trace.createdAt
  }
}
