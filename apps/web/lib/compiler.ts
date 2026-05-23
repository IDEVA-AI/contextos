import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import { embedBatch, estimateTokens, isEmbeddingsEnabled } from '@contextos/core'

// ============================================================
// Types
// ============================================================

export type CompileFormat = 'json' | 'messages' | 'markdown' | 'mcp'

export type CompileInput = {
  workspaceId: string
  brainId?: string
  contextVersion?: string
  scope?: string[]
  task?: string
  query: string
  format: CompileFormat
  budgetTokens?: number
  consumer?: string
  includeExamples?: boolean
  apiKeyScopes?: string[] // Sprint 6 trará isso de verdade
}

export type Candidate = {
  source: 'node' | 'memory' | 'chunk'
  id: string
  type: string // node type ou 'memory:workspace' / 'chunk'
  title: string
  content: string
  priority: number
  scope: string
  scopeSpecificity: number
  tags: string[]
  mode: 'single' | 'multi'
  enabled: boolean
  embedding: number[] | null
  sourceRefId?: string // doc id pra chunks, brain id pra nodes
  createdAt: Date
  relevanceScore: number
  finalScore: number
  estimatedTokens: number
  selected: boolean
  excludeReason?: string
}

export type CompileStats = {
  tokensEstimated: number
  blocksConsidered: number
  blocksIncluded: number
  blocksExcluded: number
  warnings: string[]
}

export type CompileResult = {
  candidates: Candidate[]
  selected: Candidate[]
  stats: CompileStats
  contextVersionId: string | null
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_BUDGET = 8000

const SCOPE_SPECIFICITY: Record<string, number> = {
  global: 1,
  workspace: 2,
  empresa: 3,
  projeto: 4,
  cliente: 5,
  processo: 6,
  agente: 7,
  execucao: 8,
  temporario: 9
}

// ============================================================
// Pipeline
// ============================================================

export async function compileContext(input: CompileInput): Promise<CompileResult> {
  const budget = input.budgetTokens ?? DEFAULT_BUDGET

  // 1. Resolve scope — load brain if specified
  const scope = await resolveScope(input)

  // 2. Load candidates
  const candidates = await loadCandidates(scope)

  // 3. Apply RBAC filter (Sprint 6 — por ora aceita tudo se sem scopes)
  const afterRbac = filterByRbac(candidates, input.apiKeyScopes)

  // 4. Rank relevance
  const ranked = await rankRelevance(afterRbac, input.query)

  // 5. Detect conflicts
  const warnings = detectConflicts(ranked)

  // 6. Order by priority + scope tiebreak, resolve single mode
  const ordered = orderAndResolveSingle(ranked)

  // 7. Compress to budget
  const selected = compressToBudget(ordered, budget)

  // 8. Stats
  const stats: CompileStats = {
    tokensEstimated: selected.reduce((acc, c) => acc + c.estimatedTokens, 0),
    blocksConsidered: candidates.length,
    blocksIncluded: selected.length,
    blocksExcluded: ordered.length - selected.length,
    warnings
  }

  return {
    candidates: ordered,
    selected,
    stats,
    contextVersionId: scope.contextVersionId
  }
}

// ============================================================
// 1. Resolve scope
// ============================================================

type ResolvedScope = {
  workspaceId: string
  brainIds: string[]
  projectIds: string[]
  contextVersionId: string | null
}

async function resolveScope(input: CompileInput): Promise<ResolvedScope> {
  if (input.brainId) {
    const [brain] = await db
      .select({
        id: schema.brains.id,
        projectId: schema.brains.projectId,
        workspaceId: schema.projects.workspaceId,
        currentVersionId: schema.brains.currentVersionId
      })
      .from(schema.brains)
      .innerJoin(schema.projects, eq(schema.projects.id, schema.brains.projectId))
      .where(eq(schema.brains.id, input.brainId))
      .limit(1)

    if (!brain) {
      throw new Error('brain_not_found')
    }

    return {
      workspaceId: brain.workspaceId,
      brainIds: [brain.id],
      projectIds: [brain.projectId],
      contextVersionId: brain.currentVersionId
    }
  }

  // Sem brain — pega todos os brains do workspace
  const brains = await db
    .select({
      id: schema.brains.id,
      projectId: schema.brains.projectId
    })
    .from(schema.brains)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.brains.projectId))
    .where(eq(schema.projects.workspaceId, input.workspaceId))

  return {
    workspaceId: input.workspaceId,
    brainIds: brains.map((b) => b.id),
    projectIds: [...new Set(brains.map((b) => b.projectId))],
    contextVersionId: null
  }
}

// ============================================================
// 2. Load candidates
// ============================================================

async function loadCandidates(scope: ResolvedScope): Promise<Candidate[]> {
  const candidates: Candidate[] = []

  // Nodes (do canvas)
  if (scope.brainIds.length > 0) {
    const nodes = await db
      .select()
      .from(schema.nodes)
      .where(
        and(
          inArray(schema.nodes.brainId, scope.brainIds),
          eq(schema.nodes.enabled, true)
        )
      )
    for (const n of nodes) {
      const content = n.content ?? ''
      candidates.push({
        source: 'node',
        id: n.id,
        type: n.type,
        title: n.title,
        content,
        priority: n.priority,
        scope: n.scope,
        scopeSpecificity: SCOPE_SPECIFICITY[n.scope] ?? 0,
        tags: n.tags,
        mode: n.mode,
        enabled: n.enabled,
        embedding: null, // nodes ainda não geram embedding (fase 2 talvez)
        sourceRefId: n.brainId,
        createdAt: n.updatedAt,
        relevanceScore: 0,
        finalScore: 0,
        estimatedTokens: estimateTokens(`${n.title}\n${content}`),
        selected: false
      })
    }
  }

  // Memórias (workspace + projetos)
  const memoryConditions = [
    and(
      eq(schema.memories.scopeType, 'workspace' as const),
      eq(schema.memories.scopeId, scope.workspaceId)
    )
  ]
  for (const pid of scope.projectIds) {
    memoryConditions.push(
      and(
        eq(schema.memories.scopeType, 'projeto' as const),
        eq(schema.memories.scopeId, pid)
      )
    )
  }
  const memOr = memoryConditions.reduce(
    (acc, c) => (acc ? sql`${acc} OR ${c}` : c),
    undefined as ReturnType<typeof and> | undefined
  )
  if (memOr) {
    const memories = await db.select().from(schema.memories).where(memOr)
    for (const m of memories) {
      candidates.push({
        source: 'memory',
        id: m.id,
        type: `memory:${m.scopeType}`,
        title: m.title ?? 'Memória',
        content: m.content,
        priority: 50,
        scope: m.scopeType,
        scopeSpecificity: SCOPE_SPECIFICITY[m.scopeType] ?? 5,
        tags: m.tags,
        mode: 'multi',
        enabled: true,
        embedding: m.embedding as number[] | null,
        sourceRefId: m.scopeId,
        createdAt: m.createdAt,
        relevanceScore: 0,
        finalScore: 0,
        estimatedTokens: estimateTokens(`${m.title ?? ''}\n${m.content}`),
        selected: false
      })
    }
  }

  // Chunks (knowledge dos docs dos brains)
  if (scope.brainIds.length > 0) {
    const chunks = await db
      .select()
      .from(schema.knowledgeChunks)
      .where(inArray(schema.knowledgeChunks.brainId, scope.brainIds))
    for (const c of chunks) {
      candidates.push({
        source: 'chunk',
        id: c.id,
        type: 'chunk',
        title: `Chunk ${c.chunkIndex}`,
        content: c.content,
        priority: 40,
        scope: 'projeto',
        scopeSpecificity: SCOPE_SPECIFICITY.projeto ?? 4,
        tags: c.tags,
        mode: 'multi',
        enabled: true,
        embedding: c.embedding as number[] | null,
        sourceRefId: c.documentId,
        createdAt: c.createdAt,
        relevanceScore: 0,
        finalScore: 0,
        estimatedTokens: c.tokens,
        selected: false
      })
    }
  }

  return candidates
}

// ============================================================
// 3. RBAC filter (placeholder Sprint 6)
// ============================================================

function filterByRbac(
  candidates: Candidate[],
  apiKeyScopes: string[] | undefined
): Candidate[] {
  if (apiKeyScopes === undefined) {
    // Session-based call (owner do workspace) — sem RBAC, acesso completo
    return candidates
  }
  // Bearer (API key) — aplica tag-based RBAC default-deny
  // Bloco entra se TODAS suas tags estão em scopes da key
  // Bloco sem tags = só acessível com scope 'public'
  return candidates.filter((c) => {
    if (c.tags.length === 0) return apiKeyScopes.includes('public')
    return c.tags.every((tag) =>
      apiKeyScopes.some((s) => tagMatchesScope(tag, s))
    )
  })
}

function tagMatchesScope(tag: string, scope: string): boolean {
  if (tag === scope) return true
  if (scope === '*') return true
  if (scope.endsWith(':*')) {
    return tag.startsWith(scope.slice(0, -1))
  }
  return false
}

// ============================================================
// 4. Rank relevance
// ============================================================

async function rankRelevance(
  candidates: Candidate[],
  query: string
): Promise<Candidate[]> {
  if (candidates.length === 0) return []

  const semantic = isEmbeddingsEnabled()
  const [queryEmbedding] = semantic ? await embedBatch([query]) : [null]
  const now = Date.now()

  for (const c of candidates) {
    let relevance = 0
    if (queryEmbedding && c.embedding && c.embedding.length === queryEmbedding.length) {
      relevance = cosineSimilarity(queryEmbedding, c.embedding)
    } else {
      // Fallback textual: prop se substring da query aparece
      const text = `${c.title} ${c.content}`.toLowerCase()
      const q = query.toLowerCase()
      relevance = text.includes(q) ? 0.7 : textMatchScore(text, q)
    }
    c.relevanceScore = relevance

    const ageDays = Math.max(
      0,
      (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const recencyBoost = Math.max(0, 1 - ageDays / 90) // decai em 90 dias

    c.finalScore =
      relevance * 0.6 + (c.priority / 100) * 0.3 + recencyBoost * 0.1
  }

  return candidates
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    na += ai * ai
    nb += bi * bi
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function textMatchScore(text: string, query: string): number {
  const words = query.split(/\s+/).filter((w) => w.length > 2)
  if (words.length === 0) return 0
  const matches = words.filter((w) => text.includes(w)).length
  return matches / words.length / 2 // max 0.5
}

// ============================================================
// 5. Detect conflicts
// ============================================================

function detectConflicts(candidates: Candidate[]): string[] {
  const warnings: string[] = []
  const groups = new Map<string, Candidate[]>()

  for (const c of candidates) {
    if (c.mode !== 'single') continue
    const list = groups.get(c.type) ?? []
    list.push(c)
    groups.set(c.type, list)
  }

  for (const [type, group] of groups) {
    if (group.length <= 1) continue
    const priorities = group.map((c) => c.priority)
    const range = Math.max(...priorities) - Math.min(...priorities)
    if (range <= 5) {
      warnings.push(
        `Conflito potencial: ${group.length} blocos do tipo "${type}" com prioridades próximas (range ${range})`
      )
    }
  }

  return warnings
}

// ============================================================
// 6. Order + resolve single mode
// ============================================================

function orderAndResolveSingle(candidates: Candidate[]): Candidate[] {
  // Ordena: priority desc, score desc, scopeSpecificity desc (mais específico ganha empate)
  const sorted = [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    if (b.scopeSpecificity !== a.scopeSpecificity) {
      return b.scopeSpecificity - a.scopeSpecificity
    }
    return b.finalScore - a.finalScore
  })

  // Resolve single mode: mantém apenas o primeiro de cada type single
  const seenSingle = new Set<string>()
  const result: Candidate[] = []
  for (const c of sorted) {
    if (c.mode === 'single') {
      if (seenSingle.has(c.type)) {
        c.excludeReason = `Outro bloco "${c.type}" venceu (single mode)`
        continue
      }
      seenSingle.add(c.type)
    }
    result.push(c)
  }
  return result
}

// ============================================================
// 7. Compress to budget
// ============================================================

function compressToBudget(candidates: Candidate[], budgetTokens: number): Candidate[] {
  // Re-ordena por finalScore desc (já que single resolvido, agora prioridade ranking puro)
  const byFinalScore = [...candidates].sort((a, b) => b.finalScore - a.finalScore)
  const selected: Candidate[] = []
  let running = 0
  for (const c of byFinalScore) {
    if (running + c.estimatedTokens <= budgetTokens) {
      c.selected = true
      selected.push(c)
      running += c.estimatedTokens
    } else {
      c.excludeReason = `Budget excedido (${running} + ${c.estimatedTokens} > ${budgetTokens})`
    }
  }
  return selected
}
