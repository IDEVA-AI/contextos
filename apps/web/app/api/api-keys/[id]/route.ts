import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  getApiKeyByIdForUser,
  revokeApiKey,
  updateApiKeyScopes
} from '@/lib/api-key'
import { getCurrentSession } from '@/lib/session'

type Ctx = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  scopes: z.array(z.string().min(1).max(80))
})

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getApiKeyByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }
  const updated = await updateApiKeyScopes({ keyId: id, scopes: parsed.data.scopes })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getApiKeyByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  await revokeApiKey(id)
  return new NextResponse(null, { status: 204 })
}
