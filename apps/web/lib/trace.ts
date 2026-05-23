import { db, schema } from '@contextos/db'
import type { CompileStats } from './compiler'

export type TraceInput = {
  workspaceId: string
  brainId?: string
  brainVersionId?: string | null
  apiKeyId?: string
  endpoint: string
  requestPayload: unknown
  responsePackageId?: string
  stats: CompileStats
  statusCode: number
  durationMs: number
}

export async function persistTrace(input: TraceInput): Promise<string> {
  const [row] = await db
    .insert(schema.executionTraces)
    .values({
      workspaceId: input.workspaceId,
      brainId: input.brainId,
      brainVersionId: input.brainVersionId ?? undefined,
      apiKeyId: input.apiKeyId,
      endpoint: input.endpoint,
      requestPayload: input.requestPayload as Record<string, unknown>,
      responsePackageId: input.responsePackageId ?? null,
      blocksConsidered: input.stats.blocksConsidered,
      blocksIncluded: input.stats.blocksIncluded,
      blocksExcluded: input.stats.blocksExcluded,
      tokensEstimated: input.stats.tokensEstimated,
      warnings: input.stats.warnings,
      statusCode: input.statusCode,
      durationMs: input.durationMs
    })
    .returning({ id: schema.executionTraces.id })
  if (!row) throw new Error('failed_to_persist_trace')
  return row.id
}
