import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/session'
import { createWorkspace, listWorkspacesForUser } from '@/lib/workspace'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const workspaces = await listWorkspacesForUser(session.userId)
  return NextResponse.json({ workspaces })
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80)
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
  const workspace = await createWorkspace({
    ownerId: session.userId,
    name: parsed.data.name
  })
  return NextResponse.json(workspace, { status: 201 })
}
