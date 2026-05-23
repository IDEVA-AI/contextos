import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listBrainsForWorkspace } from '@/lib/brain'
import { authenticateV1Request } from '@/lib/v1-auth'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

const QuerySchema = z.object({
  workspace_id: z.string().uuid()
})

export async function GET(req: Request) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    workspace_id: url.searchParams.get('workspace_id') ?? undefined
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  if (auth.source === 'api_key' && auth.workspaceId !== parsed.data.workspace_id) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  const ws = await getWorkspaceByIdForUser(parsed.data.workspace_id, auth.userId)
  if (!ws) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 404 })
  }

  const brains = await listBrainsForWorkspace(ws.id)
  return NextResponse.json({
    workspace_id: ws.id,
    brains: brains.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      project_id: b.projectId,
      project_name: b.projectName,
      current_version_id: b.currentVersionId,
      created_at: b.createdAt,
      updated_at: b.updatedAt
    })),
    total: brains.length
  })
}
