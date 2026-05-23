import IORedis from 'ioredis'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@contextos/db'

const startedAt = Date.now()

export async function GET() {
  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string }> = {}

  // DB
  const dbStart = Date.now()
  try {
    await db.execute(sql`SELECT 1`)
    checks.db = { ok: true, latency_ms: Date.now() - dbStart }
  } catch (err) {
    checks.db = {
      ok: false,
      latency_ms: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'unknown'
    }
  }

  // Redis
  const redisStart = Date.now()
  try {
    const url = process.env.REDIS_URL
    if (!url) throw new Error('REDIS_URL not set')
    const client = new IORedis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true
    })
    await client.connect()
    const pong = await client.ping()
    await client.quit()
    checks.redis = {
      ok: pong === 'PONG',
      latency_ms: Date.now() - redisStart
    }
  } catch (err) {
    checks.redis = {
      ok: false,
      latency_ms: Date.now() - redisStart,
      error: err instanceof Error ? err.message : 'unknown'
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks
    },
    { status: allOk ? 200 : 503 }
  )
}
