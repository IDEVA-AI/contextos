import { NextResponse } from 'next/server'
import { z } from 'zod'

import { ensureScopeAccess, searchMemoriesSemantic } from '@/lib/memory'
import { getCurrentSession } from '@/lib/session'

// Conforme PRD §9.4

const SearchSchema = z.object({
  workspace_id: z.string().uuid(),
  scope_type: z.enum(['workspace', 'projeto', 'execucao']),
  scope_id: z.string().uuid(),
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).default(10)
})

export async function POST(req: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = SearchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  const ok = await ensureScopeAccess({
    scopeType: parsed.data.scope_type,
    scopeId: parsed.data.scope_id,
    userId: session.userId
  })
  if (!ok) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const hits = await searchMemoriesSemantic({
    scopeType: parsed.data.scope_type,
    scopeId: parsed.data.scope_id,
    query: parsed.data.query,
    limit: parsed.data.limit
  })

  return NextResponse.json({
    memories: hits.map((h) => ({
      id: h.id,
      title: h.title,
      content: h.content,
      relevance_score: h.relevanceScore,
      tags: h.tags,
      created_at: h.createdAt
    })),
    total: hits.length
  })
}
