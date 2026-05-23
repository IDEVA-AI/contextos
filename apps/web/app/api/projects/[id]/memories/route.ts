import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import { createMemoryRecord, listMemoriesForScope } from '@/lib/memory'
import { getProjectByIdForUser } from '@/lib/project'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const project = await getProjectByIdForUser(id, session.userId)
  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const memories = await listMemoriesForScope({
    scopeType: 'projeto',
    scopeId: project.id
  })
  return NextResponse.json({ memories })
}

const CreateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(8000),
  tags: z.array(z.string()).optional()
})

export async function POST(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const project = await getProjectByIdForUser(id, session.userId)
  if (!project) {
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
  const memory = await createMemoryRecord({
    scopeType: 'projeto',
    scopeId: project.id,
    title: parsed.data.title,
    content: parsed.data.content,
    tags: parsed.data.tags
  })
  return NextResponse.json(memory, { status: 201 })
}
