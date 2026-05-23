import { NextResponse } from 'next/server'

import { deleteDocument, getDocumentByIdForUser } from '@/lib/document'
import { getCurrentSession } from '@/lib/session'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const doc = await getDocumentByIdForUser(id, session.userId)
  if (!doc) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  await deleteDocument(id)
  return new NextResponse(null, { status: 204 })
}
