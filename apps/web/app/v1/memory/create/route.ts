import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createMemoryRecord, ensureScopeAccess } from '@/lib/memory'
import { getCurrentSession } from '@/lib/session'

// Conforme PRD §9.5
// Auth: por ora via cookie de sessão. API Key Bearer entra Sprint 6 (RBAC).

const CreateSchema = z.object({
  workspace_id: z.string().uuid(),
  scope_type: z.enum(['workspace', 'projeto', 'execucao']),
  scope_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(8000),
  tags: z.array(z.string()).optional()
})

export async function POST(req: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = CreateSchema.safeParse(body)
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

  const memory = await createMemoryRecord({
    scopeType: parsed.data.scope_type,
    scopeId: parsed.data.scope_id,
    title: parsed.data.title,
    content: parsed.data.content,
    tags: parsed.data.tags
  })

  return NextResponse.json(
    { id: memory.id, created_at: memory.createdAt },
    { status: 201 }
  )
}
