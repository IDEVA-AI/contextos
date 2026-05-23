import { NextResponse } from 'next/server'

import { getBrainByIdForUser } from '@/lib/brain'
import { createDocument, listDocumentsForBrain } from '@/lib/document'
import { getIndexQueue, INDEX_DOCUMENT_QUEUE } from '@/lib/queue'
import { getCurrentSession } from '@/lib/session'
import { getStorage } from '@/lib/storage'

const MAX_BYTES = 25 * 1024 * 1024 // 25MB

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown'
])

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md'
}

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
  const documents = await listDocumentsForBrain(brain.id)
  return NextResponse.json({ documents })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { id } = await params
  const brain = await getBrainByIdForUser(id, session.userId)
  if (!brain) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 })
  }

  // Validate mime (também aceita por extensão se mime ausente)
  let mime = file.type
  const lowerName = file.name.toLowerCase()
  if (!mime || mime === 'application/octet-stream') {
    if (lowerName.endsWith('.pdf')) mime = 'application/pdf'
    else if (lowerName.endsWith('.md')) mime = 'text/markdown'
    else if (lowerName.endsWith('.txt')) mime = 'text/plain'
  }
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: 'unsupported_mime', mime },
      { status: 415 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'file_too_large', limit: MAX_BYTES },
      { status: 413 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = EXTENSION_BY_MIME[mime] ?? 'bin'
  const fileRef = await getStorage().save(buffer, { extension })

  const doc = await createDocument({
    brainId: brain.id,
    fileName: file.name,
    fileRef,
    mimeType: mime,
    sizeBytes: file.size
  })

  // Enqueue indexação (worker BullMQ processa)
  try {
    await getIndexQueue().add(INDEX_DOCUMENT_QUEUE, {
      documentId: doc.id,
      brainId: brain.id
    })
  } catch (err) {
    console.error('Failed to enqueue index job:', err)
  }

  return NextResponse.json(
    {
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      status: doc.status,
      createdAt: doc.createdAt
    },
    { status: 201 }
  )
}
