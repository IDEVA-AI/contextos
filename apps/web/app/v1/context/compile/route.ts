import { NextResponse } from 'next/server'
import { z } from 'zod'

import { compileContext, type CompileInput } from '@/lib/compiler'
import {
  getCachedPackage,
  makeCacheKey,
  setCachedPackage
} from '@/lib/compile-cache'
import { buildPackage } from '@/lib/package-builder'
import { persistTrace } from '@/lib/trace'
import { authenticateV1Request } from '@/lib/v1-auth'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

const CompileSchema = z.object({
  workspace_id: z.string().uuid(),
  brain_id: z.string().uuid().optional(),
  context_version: z.string().optional(),
  scope: z.array(z.string()).optional(),
  task: z.string().max(500).optional(),
  query: z.string().min(1).max(2000),
  format: z.enum(['json', 'messages', 'markdown', 'mcp']).default('messages'),
  budget_tokens: z.number().int().min(100).max(50000).optional(),
  include_examples: z.boolean().optional(),
  consumer: z.string().max(100).optional()
})

export async function POST(req: Request) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = CompileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  // API keys são scoped a 1 workspace específico — não podem cruzar
  if (auth.source === 'api_key' && auth.workspaceId !== parsed.data.workspace_id) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  const ws = await getWorkspaceByIdForUser(parsed.data.workspace_id, auth.userId)
  if (!ws) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 404 })
  }

  const input: CompileInput = {
    workspaceId: parsed.data.workspace_id,
    brainId: parsed.data.brain_id,
    contextVersion: parsed.data.context_version,
    scope: parsed.data.scope,
    task: parsed.data.task,
    query: parsed.data.query,
    format: parsed.data.format,
    budgetTokens: parsed.data.budget_tokens,
    consumer: parsed.data.consumer,
    includeExamples: parsed.data.include_examples,
    apiKeyScopes: auth.source === 'api_key' ? auth.scopes : undefined
  }

  const cacheKey = makeCacheKey(input)
  const cached = await getCachedPackage(cacheKey)
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })
  }

  const startedAt = Date.now()
  let pkg: unknown
  let traceId: string
  try {
    const result = await compileContext(input)
    traceId = await persistTrace({
      workspaceId: ws.id,
      brainId: input.brainId,
      brainVersionId: result.contextVersionId,
      apiKeyId: auth.apiKeyId,
      endpoint: '/v1/context/compile',
      requestPayload: body,
      stats: result.stats,
      statusCode: 200,
      durationMs: Date.now() - startedAt
    })
    pkg = buildPackage({
      input,
      selected: result.selected,
      stats: result.stats,
      traceId,
      contextVersionId: result.contextVersionId
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'compile_failed',
        message: err instanceof Error ? err.message : 'unknown'
      },
      { status: 500 }
    )
  }

  await setCachedPackage(cacheKey, pkg)
  return NextResponse.json(pkg, { headers: { 'X-Cache': 'MISS' } })
}
