import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import pino from 'pino'

import { indexDocumentJob, type IndexDocumentPayload } from './jobs/index-document'

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' })

const INDEX_DOCUMENT_QUEUE = 'document-index'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) {
  log.fatal('REDIS_URL is required')
  process.exit(1)
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })

const indexWorker = new Worker<IndexDocumentPayload>(
  INDEX_DOCUMENT_QUEUE,
  async (job) => {
    await indexDocumentJob(job, log.child({ job: job.id, queue: INDEX_DOCUMENT_QUEUE }))
  },
  {
    connection,
    concurrency: 2
  }
)

indexWorker.on('completed', (job) => {
  log.info({ job: job.id }, 'job completed')
})

indexWorker.on('failed', (job, err) => {
  log.error({ job: job?.id, err: err.message }, 'job failed')
})

log.info('@contextos/worker started')
log.info(
  `Listening on queue: ${INDEX_DOCUMENT_QUEUE} (concurrency 2, redis: ${redisUrl})`
)

// Graceful shutdown
async function shutdown(signal: string) {
  log.info({ signal }, 'shutting down...')
  await indexWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
