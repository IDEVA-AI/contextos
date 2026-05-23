import type { Job } from 'bullmq'
import { eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import {
  chunkText,
  embedBatch,
  extractText,
  getStorage,
  isEmbeddingsEnabled
} from '@contextos/core'
import type { Logger } from 'pino'

export type IndexDocumentPayload = {
  documentId: string
  brainId: string
}

export async function indexDocumentJob(
  job: Job<IndexDocumentPayload>,
  log: Logger
): Promise<void> {
  const { documentId, brainId } = job.data
  log.info({ documentId, brainId }, 'index-document start')

  const [doc] = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, documentId))
    .limit(1)

  if (!doc) {
    log.warn({ documentId }, 'document not found, skipping')
    return
  }

  await db
    .update(schema.documents)
    .set({ status: 'indexing' })
    .where(eq(schema.documents.id, documentId))

  try {
    const buffer = await getStorage().read(doc.fileRef)
    const text = await extractText({ buffer, mimeType: doc.mimeType })
    const chunks = chunkText(text, 500)
    log.info(
      { documentId, chunks: chunks.length, embeddings: isEmbeddingsEnabled() },
      'chunked'
    )

    // Apaga chunks antigos (caso re-index)
    await db
      .delete(schema.knowledgeChunks)
      .where(eq(schema.knowledgeChunks.documentId, documentId))

    if (chunks.length === 0) {
      await db
        .update(schema.documents)
        .set({ status: 'ready' })
        .where(eq(schema.documents.id, documentId))
      return
    }

    // Embeddings em batch (OpenAI aceita ate ~2048 inputs por call;
    // pra segurança quebra em chunks de 100)
    const BATCH_SIZE = 100
    const embeddings: (number[] | null)[] = []
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const slice = chunks.slice(i, i + BATCH_SIZE).map((c) => c.content)
      const batch = await embedBatch(slice)
      embeddings.push(...batch)
    }

    // Insert chunks (uma transação)
    await db.transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = embeddings[i]
        if (!chunk) continue
        await tx.insert(schema.knowledgeChunks).values({
          documentId,
          brainId,
          chunkIndex: chunk.index,
          content: chunk.content,
          tokens: chunk.estimatedTokens,
          embedding: embedding ?? null,
          tags: doc.fileName.toLowerCase().includes('confidential')
            ? ['confidential']
            : ['public']
        })
      }
    })

    await db
      .update(schema.documents)
      .set({ status: 'ready' })
      .where(eq(schema.documents.id, documentId))

    log.info({ documentId, chunks: chunks.length }, 'index-document done')
  } catch (err) {
    log.error({ err, documentId }, 'index-document failed')
    await db
      .update(schema.documents)
      .set({ status: 'error' })
      .where(eq(schema.documents.id, documentId))
    throw err
  }
}
