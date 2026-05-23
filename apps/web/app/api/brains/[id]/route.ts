import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import {
  deleteBrain,
  getBrainByIdForUser,
  updateBrain
} from '@/lib/brain'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const brain = await getBrainByIdForUser(id, session.userId)
  if (!brain) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(brain)
}

const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional()
})

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getBrainByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }
  const updated = await updateBrain({ brainId: id, ...parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getBrainByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  await deleteBrain(id)
  return new NextResponse(null, { status: 204 })
}
