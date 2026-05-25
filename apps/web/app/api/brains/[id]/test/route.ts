import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getBrainByIdForUser } from '@/lib/brain'
import { compileContext } from '@/lib/compiler'
import { getProvider, NoProviderError } from '@/lib/llm-provider'
import { buildPackage } from '@/lib/package-builder'
import { getCurrentSession } from '@/lib/session'
import { persistTrace } from '@/lib/trace'

type Ctx = { params: Promise<{ id: string }> }

const TestSchema = z.object({
  query: z.string().min(1).max(2000),
  task: z.string().max(500).optional(),
  budget_tokens: z.number().int().min(100).max(50000).optional()
})

export async function POST(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const brain = await getBrainByIdForUser(id, session.userId)
  if (!brain) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = TestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  let provider
  try {
    provider = getProvider()
  } catch (err) {
    if (err instanceof NoProviderError) {
      return NextResponse.json(
        { error: 'no_provider', message: err.message },
        { status: 503 }
      )
    }
    throw err
  }

  const startedAt = Date.now()
  const compileResult = await compileContext({
    workspaceId: brain.workspaceId,
    brainId: brain.id,
    query: parsed.data.query,
    task: parsed.data.task,
    format: 'messages',
    budgetTokens: parsed.data.budget_tokens ?? 4000,
    consumer: `test-${provider.name}`
  })

  const traceId = await persistTrace({
    workspaceId: brain.workspaceId,
    brainId: brain.id,
    brainVersionId: compileResult.contextVersionId,
    endpoint: `/api/brains/${brain.id}/test`,
    requestPayload: { ...parsed.data, provider: provider.name },
    stats: compileResult.stats,
    statusCode: 200,
    durationMs: Date.now() - startedAt
  })

  const pkg = buildPackage({
    input: {
      workspaceId: brain.workspaceId,
      brainId: brain.id,
      query: parsed.data.query,
      task: parsed.data.task,
      format: 'messages',
      budgetTokens: parsed.data.budget_tokens ?? 4000
    },
    selected: compileResult.selected,
    stats: compileResult.stats,
    traceId,
    contextVersionId: compileResult.contextVersionId
  }) as {
    messages: Array<{ role: 'system' | 'user'; content: string }>
  }

  const systemContent = pkg.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')

  let result
  try {
    result = await provider.generate({
      system: systemContent,
      messages: [{ role: 'user', content: parsed.data.query }]
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json(
      { error: 'llm_call_failed', provider: provider.name, message },
      { status: 502 }
    )
  }

  return NextResponse.json({
    provider: result.provider,
    model: result.model,
    trace_id: traceId,
    package_stats: compileResult.stats,
    compiled_messages: pkg.messages,
    response: result.text,
    llm_duration_ms: result.duration_ms
  })
}
