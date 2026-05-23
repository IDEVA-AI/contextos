import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createMemoryRecord, ensureScopeAccess } from '@/lib/memory'
import { authenticateV1Request } from '@/lib/v1-auth'

// Conforme PRD §9.5

const CreateSchema = z.object({
  workspace_id: z.string().uuid(),
  scope_type: z.enum(['workspace', 'projeto', 'execucao']),
  scope_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(8000),
  tags: z.array(z.string()).optional()
})

export async function POST(req: Request) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
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

  if (auth.source === 'api_key' && auth.workspaceId !== parsed.data.workspace_id) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  const ok = await ensureScopeAccess({
    scopeType: parsed.data.scope_type,
    scopeId: parsed.data.scope_id,
    userId: auth.userId
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
