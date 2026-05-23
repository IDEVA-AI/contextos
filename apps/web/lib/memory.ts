import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import { embedBatch, isEmbeddingsEnabled } from '@contextos/core'

export type MemorySummary = {
  id: string
  scopeType: schema.Memory['scopeType']
  scopeId: string
  title: string | null
  content: string
  tags: string[]
  createdAt: Date
  hasEmbedding: boolean
}

export type MemorySearchHit = MemorySummary & {
  relevanceScore: number
}

async function ensureWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(
      and(eq(schema.workspaces.id, workspaceId), eq(schema.workspaces.ownerId, userId))
    )
    .limit(1)
  return !!row
}

async function ensureProjectAccess(
  projectId: string,
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ workspaceId: schema.projects.workspaceId })
    .from(schema.projects)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.projects.workspaceId))
    .where(
      and(eq(schema.projects.id, projectId), eq(schema.workspaces.ownerId, userId))
    )
    .limit(1)
  return row?.workspaceId ?? null
}

export async function ensureScopeAccess(params: {
  scopeType: schema.Memory['scopeType']
  scopeId: string
  userId: string
}): Promise<boolean> {
  if (params.scopeType === 'workspace') {
    return ensureWorkspaceAccess(params.scopeId, params.userId)
  }
  if (params.scopeType === 'projeto') {
    return (await ensureProjectAccess(params.scopeId, params.userId)) !== null
  }
  // execucao: scope_id é id de execution_trace (workspace via trace)
  const [row] = await db
    .select({ ownerId: schema.workspaces.ownerId })
    .from(schema.executionTraces)
    .innerJoin(
      schema.workspaces,
      eq(schema.workspaces.id, schema.executionTraces.workspaceId)
    )
    .where(eq(schema.executionTraces.id, params.scopeId))
    .limit(1)
  return row?.ownerId === params.userId
}

function rowToSummary(row: schema.Memory): MemorySummary {
  return {
    id: row.id,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    title: row.title,
    content: row.content,
    tags: row.tags,
    createdAt: row.createdAt,
    hasEmbedding: row.embedding !== null
  }
}

export async function listMemoriesForScope(params: {
  scopeType: schema.Memory['scopeType']
  scopeId: string
}): Promise<MemorySummary[]> {
  const rows = await db
    .select()
    .from(schema.memories)
    .where(
      and(
        eq(schema.memories.scopeType, params.scopeType),
        eq(schema.memories.scopeId, params.scopeId)
      )
    )
    .orderBy(desc(schema.memories.createdAt))
  return rows.map(rowToSummary)
}

export async function listMemoriesForWorkspace(
  workspaceId: string
): Promise<MemorySummary[]> {
  // Memorias do workspace + de todos seus projetos
  const projectIds = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.workspaceId, workspaceId))

  const conditions = [
    and(
      eq(schema.memories.scopeType, 'workspace' as const),
      eq(schema.memories.scopeId, workspaceId)
    )
  ]
  for (const p of projectIds) {
    conditions.push(
      and(
        eq(schema.memories.scopeType, 'projeto' as const),
        eq(schema.memories.scopeId, p.id)
      )
    )
  }

  const rows = await db
    .select()
    .from(schema.memories)
    .where(or(...conditions.filter(Boolean)))
    .orderBy(desc(schema.memories.createdAt))

  return rows.map(rowToSummary)
}

export async function getMemoryByIdForUser(
  memoryId: string,
  userId: string
): Promise<MemorySummary | null> {
  const [row] = await db
    .select()
    .from(schema.memories)
    .where(eq(schema.memories.id, memoryId))
    .limit(1)
  if (!row) return null
  const ok = await ensureScopeAccess({
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    userId
  })
  if (!ok) return null
  return rowToSummary(row)
}

export async function createMemoryRecord(params: {
  scopeType: schema.Memory['scopeType']
  scopeId: string
  title?: string
  content: string
  tags?: string[]
}): Promise<MemorySummary> {
  const embedSource = `${params.title ?? ''}\n${params.content}`.trim()
  const [embedding] = await embedBatch([embedSource])

  const [row] = await db
    .insert(schema.memories)
    .values({
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      title: params.title ?? null,
      content: params.content,
      tags: params.tags ?? [],
      embedding: embedding ?? null
    })
    .returning()

  if (!row) throw new Error('failed_to_create_memory')
  return rowToSummary(row)
}

export async function updateMemoryRecord(params: {
  memoryId: string
  title?: string | null
  content?: string
  tags?: string[]
}): Promise<MemorySummary | null> {
  const patch: Record<string, unknown> = {}
  if (params.title !== undefined) patch.title = params.title
  if (params.content !== undefined) patch.content = params.content
  if (params.tags !== undefined) patch.tags = params.tags

  // Re-gerar embedding se conteúdo mudou
  if (params.content !== undefined || params.title !== undefined) {
    const [current] = await db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.id, params.memoryId))
      .limit(1)
    if (!current) return null
    const newTitle = params.title !== undefined ? params.title : current.title
    const newContent = params.content !== undefined ? params.content : current.content
    const source = `${newTitle ?? ''}\n${newContent}`.trim()
    const [embedding] = await embedBatch([source])
    patch.embedding = embedding ?? null
  }

  if (Object.keys(patch).length === 0) {
    return getMemoryByIdRaw(params.memoryId)
  }

  const [row] = await db
    .update(schema.memories)
    .set(patch)
    .where(eq(schema.memories.id, params.memoryId))
    .returning()

  return row ? rowToSummary(row) : null
}

async function getMemoryByIdRaw(memoryId: string): Promise<MemorySummary | null> {
  const [row] = await db
    .select()
    .from(schema.memories)
    .where(eq(schema.memories.id, memoryId))
    .limit(1)
  return row ? rowToSummary(row) : null
}

export async function deleteMemoryRecord(memoryId: string): Promise<boolean> {
  const result = await db
    .delete(schema.memories)
    .where(eq(schema.memories.id, memoryId))
    .returning({ id: schema.memories.id })
  return result.length > 0
}

export async function searchMemoriesSemantic(params: {
  scopeType?: schema.Memory['scopeType']
  scopeId?: string
  query: string
  limit?: number
}): Promise<MemorySearchHit[]> {
  const limit = params.limit ?? 10
  const semantic = isEmbeddingsEnabled()
  const [queryEmbedding] = semantic ? await embedBatch([params.query]) : [null]

  // Filtro de escopo
  const scopeFilter =
    params.scopeType && params.scopeId
      ? and(
          eq(schema.memories.scopeType, params.scopeType),
          eq(schema.memories.scopeId, params.scopeId)
        )
      : undefined

  if (queryEmbedding) {
    // Busca semântica via cosine distance pgvector (<=> operador)
    const embedLiteral = `[${queryEmbedding.join(',')}]`
    const rows = await db
      .select({
        row: schema.memories,
        distance: sql<number>`${schema.memories.embedding} <=> ${embedLiteral}::vector`
      })
      .from(schema.memories)
      .where(
        and(
          scopeFilter,
          sql`${schema.memories.embedding} IS NOT NULL`
        )
      )
      .orderBy(sql`${schema.memories.embedding} <=> ${embedLiteral}::vector`)
      .limit(limit)

    return rows.map(({ row, distance }) => ({
      ...rowToSummary(row),
      relevanceScore: 1 - distance // cosine distance → similarity
    }))
  }

  // Fallback: busca textual (ILIKE) — sem embedding disponível
  const like = `%${params.query}%`
  const rows = await db
    .select()
    .from(schema.memories)
    .where(
      and(
        scopeFilter,
        or(ilike(schema.memories.content, like), ilike(schema.memories.title, like))
      )
    )
    .orderBy(desc(schema.memories.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    ...rowToSummary(row),
    relevanceScore: 0.5 // sem score real
  }))
}
