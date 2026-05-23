import { NextResponse } from 'next/server'

import { getBrainByIdForUser } from '@/lib/brain'
import { getCurrentSession } from '@/lib/session'
import { listVersionsForBrain } from '@/lib/version'

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
  const versions = await listVersionsForBrain(brain.id)
  return NextResponse.json({ versions })
}
