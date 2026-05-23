import { NextResponse } from 'next/server'

import { deleteDocument, getDocumentByIdForUser } from '@/lib/document'
import { authenticateV1Request } from '@/lib/v1-auth'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const doc = await getDocumentByIdForUser(id, auth.userId)
  if (!doc) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (auth.source === 'api_key' && auth.workspaceId !== doc.workspaceId) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }
  await deleteDocument(id)
  return NextResponse.json({ ok: true })
}
