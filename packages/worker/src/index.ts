import 'dotenv/config'
import pino from 'pino'

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' })

log.info('@contextos/worker iniciado (esqueleto v0.1.0-alpha)')
log.info('Jobs reais (indexação de documentos, embeddings) entram no Sprint 3.')

// Sprint 3: Worker BullMQ entra aqui
// import { Worker, Queue } from 'bullmq'
// import IORedis from 'ioredis'
// import { indexDocumentJob } from './jobs/index-document'

// const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
// const worker = new Worker('document-index', indexDocumentJob, { connection })

// Mantém processo vivo no esqueleto
setInterval(() => {}, 1 << 30)
