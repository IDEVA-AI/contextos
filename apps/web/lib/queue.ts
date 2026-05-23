import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const INDEX_DOCUMENT_QUEUE = 'document-index'

export type IndexDocumentJob = {
  documentId: string
  brainId: string
}

let cachedQueue: Queue<IndexDocumentJob> | null = null
let cachedConnection: IORedis | null = null

function getConnection(): IORedis {
  if (cachedConnection) return cachedConnection
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL is required')
  cachedConnection = new IORedis(url, { maxRetriesPerRequest: null })
  return cachedConnection
}

export function getIndexQueue(): Queue<IndexDocumentJob> {
  if (cachedQueue) return cachedQueue
  cachedQueue = new Queue<IndexDocumentJob>(INDEX_DOCUMENT_QUEUE, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 }
    }
  })
  return cachedQueue
}
