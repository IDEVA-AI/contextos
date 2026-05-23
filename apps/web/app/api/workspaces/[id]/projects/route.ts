import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import { createProject, listProjectsForWorkspace } from '@/lib/project'
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
  const projects = await listProjectsForWorkspace(workspace.id)
  return NextResponse.json({ projects })
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
  const project = await createProject({
    workspaceId: workspace.id,
    name: parsed.data.name,
    description: parsed.data.description
  })
  return NextResponse.json(project, { status: 201 })
}
