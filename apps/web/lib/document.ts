import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import { getStorage } from './storage'

export type DocumentSummary = {
  id: string
  brainId: string
  fileName: string
  fileRef: string
  mimeType: string
  sizeBytes: number
  status: schema.Document['status']
  createdAt: Date
  chunkCount: number
}

export async function listDocumentsForBrain(
  brainId: string
): Promise<DocumentSummary[]> {
  const docs = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.brainId, brainId))
    .orderBy(asc(schema.documents.createdAt))

  // Conta chunks por doc (otimização: agregada simples)
  const chunkRows = await db
    .select({
      documentId: schema.knowledgeChunks.documentId,
      id: schema.knowledgeChunks.id
    })
    .from(schema.knowledgeChunks)
    .where(eq(schema.knowledgeChunks.brainId, brainId))

  const chunksByDoc = new Map<string, number>()
  for (const row of chunkRows) {
    chunksByDoc.set(row.documentId, (chunksByDoc.get(row.documentId) ?? 0) + 1)
  }

  return docs.map((d) => ({
    id: d.id,
    brainId: d.brainId,
    fileName: d.fileName,
    fileRef: d.fileRef,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    status: d.status,
    createdAt: d.createdAt,
    chunkCount: chunksByDoc.get(d.id) ?? 0
  }))
}

export async function getDocumentByIdForUser(
  documentId: string,
  userId: string
): Promise<(DocumentSummary & { workspaceId: string }) | null> {
  const [row] = await db
    .select({
      id: schema.documents.id,
      brainId: schema.documents.brainId,
      fileName: schema.documents.fileName,
      fileRef: schema.documents.fileRef,
      mimeType: schema.documents.mimeType,
      sizeBytes: schema.documents.sizeBytes,
      status: schema.documents.status,
      createdAt: schema.documents.createdAt,
      workspaceId: schema.workspaces.id
    })
    .from(schema.documents)
    .innerJoin(schema.brains, eq(schema.brains.id, schema.documents.brainId))
    .innerJoin(schema.projects, eq(schema.projects.id, schema.brains.projectId))
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.projects.workspaceId))
    .where(
      and(
        eq(schema.documents.id, documentId),
        eq(schema.workspaces.ownerId, userId)
      )
    )
    .limit(1)
  if (!row) return null
  return { ...row, chunkCount: 0 }
}

export async function createDocument(params: {
  brainId: string
  fileName: string
  fileRef: string
  mimeType: string
  sizeBytes: number
}): Promise<schema.Document> {
  const [row] = await db
    .insert(schema.documents)
    .values({
      brainId: params.brainId,
      fileName: params.fileName,
      fileRef: params.fileRef,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      status: 'uploading'
    })
    .returning()
  if (!row) throw new Error('failed_to_create_document')
  return row
}

export async function updateDocumentStatus(params: {
  documentId: string
  status: schema.Document['status']
}): Promise<void> {
  await db
    .update(schema.documents)
    .set({ status: params.status })
    .where(eq(schema.documents.id, params.documentId))
}

export async function deleteDocument(documentId: string): Promise<void> {
  const [doc] = await db
    .select({ fileRef: schema.documents.fileRef })
    .from(schema.documents)
    .where(eq(schema.documents.id, documentId))
    .limit(1)

  // Apaga chunks (cascade já cuida, mas explícito por clareza)
  await db
    .delete(schema.knowledgeChunks)
    .where(eq(schema.knowledgeChunks.documentId, documentId))

  await db.delete(schema.documents).where(eq(schema.documents.id, documentId))

  if (doc?.fileRef) {
    await getStorage().delete(doc.fileRef).catch(() => {})
  }
}
