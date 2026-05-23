import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import { createBrain, listBrainsForProject } from '@/lib/brain'
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
  const brains = await listBrainsForProject(project.id)
  return NextResponse.json({ brains })
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional()
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
  const brain = await createBrain({
    projectId: project.id,
    name: parsed.data.name,
    description: parsed.data.description
  })
  return NextResponse.json(brain, { status: 201 })
}
