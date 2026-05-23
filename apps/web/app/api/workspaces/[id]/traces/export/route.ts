import { NextResponse } from 'next/server'

import {
  listAccessLogsForWorkspace,
  logsToCsv
} from '@/lib/access-logs'
import { getCurrentSession } from '@/lib/session'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const workspace = await getWorkspaceByIdForUser(id, session.userId)
  if (!workspace) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const url = new URL(req.url)
  const hours = Number.parseInt(url.searchParams.get('hours') ?? '168', 10) // default 7 dias
  const endpoint = url.searchParams.get('endpoint') ?? undefined
  const apiKeyId = url.searchParams.get('apiKeyId') ?? undefined

  const logs = await listAccessLogsForWorkspace({
    workspaceId: workspace.id,
    hours,
    limit: 1000,
    endpoint,
    apiKeyId
  })
  const csv = logsToCsv(logs)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contextos-traces-${workspace.slug}-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  })
}
