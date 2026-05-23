import { NextResponse } from 'next/server'
import { z } from 'zod'

import { compileContext, type CompileInput } from '@/lib/compiler'
import { getCurrentSession } from '@/lib/session'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

const RetrieveSchema = z.object({
  workspace_id: z.string().uuid(),
  brain_id: z.string().uuid().optional(),
  scope: z.array(z.string()).optional(),
  query: z.string().min(1).max(2000),
  task: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(200).default(50)
})

export async function POST(req: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = RetrieveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  const ws = await getWorkspaceByIdForUser(parsed.data.workspace_id, session.userId)
  if (!ws) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 404 })
  }

  const input: CompileInput = {
    workspaceId: parsed.data.workspace_id,
    brainId: parsed.data.brain_id,
    scope: parsed.data.scope,
    query: parsed.data.query,
    task: parsed.data.task,
    format: 'json',
    budgetTokens: 999_999 // sem corte pra retrieve
  }

  const result = await compileContext(input)
  const limited = result.candidates.slice(0, parsed.data.limit)

  return NextResponse.json({
    blocks: limited.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      content: c.content,
      priority: c.priority,
      scope: c.scope,
      tags: c.tags,
      relevance_score: c.relevanceScore,
      source: c.source,
      source_id: c.sourceRefId
    })),
    total: result.candidates.length,
    warnings: result.stats.warnings
  })
}
