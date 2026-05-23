import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

import { getBrainByIdForUser } from '@/lib/brain'
import { compileContext } from '@/lib/compiler'
import { buildPackage } from '@/lib/package-builder'
import { getCurrentSession } from '@/lib/session'
import { persistTrace } from '@/lib/trace'

type Ctx = { params: Promise<{ id: string }> }

const TestSchema = z.object({
  query: z.string().min(1).max(2000),
  task: z.string().max(500).optional(),
  budget_tokens: z.number().int().min(100).max(50000).optional()
})

type Provider = 'anthropic' | 'openai' | 'none'

function detectProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'none'
}

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

  const provider = detectProvider()
  if (provider === 'none') {
    return NextResponse.json(
      {
        error: 'no_provider',
        message:
          'Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no .env.local pra usar o botão Testar.'
      },
      { status: 503 }
    )
  }

  const startedAt = Date.now()
  const compileResult = await compileContext({
    workspaceId: brain.workspaceId,
    brainId: brain.id,
    query: parsed.data.query,
    task: parsed.data.task,
    format: 'messages',
    budgetTokens: parsed.data.budget_tokens ?? 4000,
    consumer: `test-${provider}`
  })

  const traceId = await persistTrace({
    workspaceId: brain.workspaceId,
    brainId: brain.id,
    brainVersionId: compileResult.contextVersionId,
    endpoint: `/api/brains/${brain.id}/test`,
    requestPayload: { ...parsed.data, provider },
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

  // Chama LLM
  let llmResponse: string
  let llmModel: string
  try {
    if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      llmModel = process.env.ANTHROPIC_TEST_MODEL ?? 'claude-haiku-4-5-20251001'
      const systemContent = pkg.messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n\n')
      const userMessages = pkg.messages
        .filter((m) => m.role === 'user')
        .map((m) => ({ role: 'user' as const, content: m.content }))

      const result = await client.messages.create({
        model: llmModel,
        max_tokens: 1024,
        system: systemContent,
        messages:
          userMessages.length > 0
            ? userMessages
            : [{ role: 'user', content: parsed.data.query }]
      })
      const first = result.content[0]
      llmResponse =
        first?.type === 'text' ? first.text : '[resposta não-textual]'
    } else {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      llmModel = process.env.OPENAI_TEST_MODEL ?? 'gpt-5.2-mini'
      const result = await client.chat.completions.create({
        model: llmModel,
        max_completion_tokens: 1024,
        messages: pkg.messages
      })
      llmResponse =
        result.choices[0]?.message?.content ?? '[resposta vazia]'
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json(
      {
        error: 'llm_call_failed',
        provider,
        message
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    provider,
    model: llmModel,
    trace_id: traceId,
    package_stats: compileResult.stats,
    compiled_messages: pkg.messages,
    response: llmResponse
  })
}
