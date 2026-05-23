import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import {
  deleteWorkspace,
  getWorkspaceByIdForUser,
  renameWorkspace
} from '@/lib/workspace'

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
  return NextResponse.json(workspace)
}

const PatchSchema = z.object({
  name: z.string().min(1).max(80)
})

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }
  const updated = await renameWorkspace({
    workspaceId: id,
    ownerId: session.userId,
    name: parsed.data.name
  })
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const ok = await deleteWorkspace({ workspaceId: id, ownerId: session.userId })
  if (!ok) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
