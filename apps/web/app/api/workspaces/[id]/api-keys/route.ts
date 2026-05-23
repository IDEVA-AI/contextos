import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createApiKey, listApiKeysForWorkspace } from '@/lib/api-key'
import { getCurrentSession } from '@/lib/session'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const workspace = await getWorkspaceByIdForUser(id, session.userId)
  if (!workspace) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const keys = await listApiKeysForWorkspace(workspace.id)
  return NextResponse.json({ api_keys: keys })
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  scopes: z.array(z.string().min(1).max(80)).default([])
})

export async function POST(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const workspace = await getWorkspaceByIdForUser(id, session.userId)
  if (!workspace) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }
  const { summary, secret } = await createApiKey({
    workspaceId: workspace.id,
    name: parsed.data.name,
    scopes: parsed.data.scopes,
    userId: session.userId
  })
  return NextResponse.json(
    {
      ...summary,
      secret // mostrado 1x apenas
    },
    { status: 201 }
  )
}
