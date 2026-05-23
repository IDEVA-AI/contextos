import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db, schema } from '@contextos/db'

const BCRYPT_COST = 12
const KEY_PREFIX = 'ctx_sk_live_'

export type ApiKeySummary = {
  id: string
  workspaceId: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: Date | null
  totalRequests: number
  revokedAt: Date | null
  createdAt: Date
}

function rowToSummary(row: schema.ApiKey): ApiKeySummary {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    scopes: row.scopes,
    lastUsedAt: row.lastUsedAt,
    totalRequests: row.totalRequests,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt
  }
}

export async function createApiKey(params: {
  workspaceId: string
  name: string
  scopes: string[]
  userId: string
}): Promise<{ summary: ApiKeySummary; secret: string }> {
  const random = randomBytes(32).toString('base64url')
  const secret = `${KEY_PREFIX}${random}`
  const keyHash = await bcrypt.hash(secret, BCRYPT_COST)
  const keyPrefix = secret.slice(0, 16) // ctx_sk_live_XXXX (4 chars after prefix)

  const [row] = await db
    .insert(schema.apiKeys)
    .values({
      workspaceId: params.workspaceId,
      name: params.name,
      keyHash,
      keyPrefix,
      scopes: params.scopes,
      createdBy: params.userId
    })
    .returning()

  if (!row) throw new Error('failed_to_create_api_key')
  return { summary: rowToSummary(row), secret }
}

export async function listApiKeysForWorkspace(
  workspaceId: string
): Promise<ApiKeySummary[]> {
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.workspaceId, workspaceId))
    .orderBy(desc(schema.apiKeys.createdAt))
  return rows.map(rowToSummary)
}

export async function getApiKeyByIdForUser(
  keyId: string,
  userId: string
): Promise<ApiKeySummary | null> {
  const [row] = await db
    .select({
      key: schema.apiKeys,
      ownerId: schema.workspaces.ownerId
    })
    .from(schema.apiKeys)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.apiKeys.workspaceId))
    .where(and(eq(schema.apiKeys.id, keyId), eq(schema.workspaces.ownerId, userId)))
    .limit(1)
  if (!row) return null
  return rowToSummary(row.key)
}

export async function updateApiKeyScopes(params: {
  keyId: string
  scopes: string[]
}): Promise<ApiKeySummary | null> {
  const [row] = await db
    .update(schema.apiKeys)
    .set({ scopes: params.scopes })
    .where(eq(schema.apiKeys.id, params.keyId))
    .returning()
  return row ? rowToSummary(row) : null
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const result = await db
    .update(schema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(schema.apiKeys.id, keyId))
    .returning({ id: schema.apiKeys.id })
  return result.length > 0
}

export type AuthenticatedApiKey = {
  id: string
  workspaceId: string
  scopes: string[]
  userId: string // owner do workspace
}

export async function authenticateBearerToken(
  authHeader: string | null
): Promise<AuthenticatedApiKey | null> {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1]!.trim()
  if (!token.startsWith(KEY_PREFIX)) return null

  const keyPrefix = token.slice(0, 16)
  const candidates = await db
    .select({
      key: schema.apiKeys,
      ownerId: schema.workspaces.ownerId
    })
    .from(schema.apiKeys)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.apiKeys.workspaceId))
    .where(
      and(eq(schema.apiKeys.keyPrefix, keyPrefix), isNull(schema.apiKeys.revokedAt))
    )

  for (const candidate of candidates) {
    const match = await bcrypt.compare(token, candidate.key.keyHash)
    if (!match) continue

    // Atualiza stats sem bloquear o response
    db.update(schema.apiKeys)
      .set({
        lastUsedAt: new Date(),
        totalRequests: sql`${schema.apiKeys.totalRequests} + 1`
      })
      .where(eq(schema.apiKeys.id, candidate.key.id))
      .then(() => {})
      .catch(() => {})

    return {
      id: candidate.key.id,
      workspaceId: candidate.key.workspaceId,
      scopes: candidate.key.scopes,
      userId: candidate.ownerId
    }
  }
  return null
}
