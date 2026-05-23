import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getBrainByIdForUser } from '@/lib/brain'
import { createDocument, listDocumentsForBrain } from '@/lib/document'
import { getIndexQueue, INDEX_DOCUMENT_QUEUE } from '@/lib/queue'
import { getStorage } from '@/lib/storage'
import { authenticateV1Request } from '@/lib/v1-auth'

const MAX_BYTES = 25 * 1024 * 1024

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

const QuerySchema = z.object({
  brain_id: z.string().uuid()
})

export async function GET(req: Request) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    brain_id: url.searchParams.get('brain_id') ?? undefined
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  const brain = await getBrainByIdForUser(parsed.data.brain_id, auth.userId)
  if (!brain) {
    return NextResponse.json({ error: 'brain_not_found' }, { status: 404 })
  }
  if (auth.source === 'api_key' && auth.workspaceId !== brain.workspaceId) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  const documents = await listDocumentsForBrain(brain.id)
  return NextResponse.json({
    brain_id: brain.id,
    documents: documents.map((d) => ({
      id: d.id,
      file_name: d.fileName,
      mime_type: d.mimeType,
      size_bytes: d.sizeBytes,
      status: d.status,
      chunk_count: d.chunkCount,
      created_at: d.createdAt
    })),
    total: documents.length
  })
}

export async function POST(req: Request) {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const brainIdRaw = formData.get('brain_id')
  if (typeof brainIdRaw !== 'string') {
    return NextResponse.json({ error: 'brain_id_required' }, { status: 400 })
  }
  const brainIdParse = z.string().uuid().safeParse(brainIdRaw)
  if (!brainIdParse.success) {
    return NextResponse.json({ error: 'invalid_brain_id' }, { status: 400 })
  }

  const brain = await getBrainByIdForUser(brainIdParse.data, auth.userId)
  if (!brain) {
    return NextResponse.json({ error: 'brain_not_found' }, { status: 404 })
  }
  if (auth.source === 'api_key' && auth.workspaceId !== brain.workspaceId) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 })
  }

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
      file_name: doc.fileName,
      mime_type: doc.mimeType,
      size_bytes: doc.sizeBytes,
      status: doc.status,
      created_at: doc.createdAt
    },
    { status: 201 }
  )
}
