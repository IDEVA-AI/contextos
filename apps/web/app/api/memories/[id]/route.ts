import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import {
  deleteMemoryRecord,
  getMemoryByIdForUser,
  updateMemoryRecord
} from '@/lib/memory'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const memory = await getMemoryByIdForUser(id, session.userId)
  if (!memory) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(memory)
}

const PatchSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(8000).optional(),
  tags: z.array(z.string()).optional()
})

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getMemoryByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }
  const updated = await updateMemoryRecord({ memoryId: id, ...parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const existing = await getMemoryByIdForUser(id, session.userId)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  await deleteMemoryRecord(id)
  return new NextResponse(null, { status: 204 })
}
