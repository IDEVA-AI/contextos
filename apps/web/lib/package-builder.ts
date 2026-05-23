import { randomUUID } from 'node:crypto'
import type { Candidate, CompileFormat, CompileInput, CompileStats } from './compiler'

const SCHEMA_VERSION = 'v1' as const

type Block = { title: string; content: string; source_id: string }

export type CommonPackageMeta = {
  schema_version: typeof SCHEMA_VERSION
  package_id: string
  trace_id: string
  compiled_at: string
  context_version: string
  stats: CompileStats
}

export type RequestEcho = {
  workspace_id: string
  brain_id?: string
  scope: string[]
  task?: string
  query: string
  consumer?: string
  budget_tokens: number
  format: CompileFormat
}

// ============================================================
// Public entry
// ============================================================

export function buildPackage(params: {
  input: CompileInput
  selected: Candidate[]
  stats: CompileStats
  traceId: string
  contextVersionId: string | null
}): unknown {
  const meta = buildMeta(params)
  const buckets = bucketize(params.selected)

  switch (params.input.format) {
    case 'json':
      return buildJson(meta, buckets, requestEcho(params.input, 'json'))
    case 'messages':
      return buildMessages(meta, buckets, requestEcho(params.input, 'messages'), params.input.query)
    case 'markdown':
      return buildMarkdown(meta, buckets, requestEcho(params.input, 'markdown'), params.input.query)
    case 'mcp':
      return buildMcp(meta, buckets, requestEcho(params.input, 'mcp'), params.input.query)
  }
}

function buildMeta(params: {
  stats: CompileStats
  traceId: string
  contextVersionId: string | null
}): CommonPackageMeta {
  return {
    schema_version: SCHEMA_VERSION,
    package_id: `pkg_${randomUUID().slice(0, 8)}`,
    trace_id: params.traceId,
    compiled_at: new Date().toISOString(),
    context_version: params.contextVersionId ?? 'live',
    stats: params.stats
  }
}

function requestEcho(input: CompileInput, format: CompileFormat): RequestEcho {
  return {
    workspace_id: input.workspaceId,
    brain_id: input.brainId,
    scope: input.scope ?? [],
    task: input.task,
    query: input.query,
    consumer: input.consumer,
    budget_tokens: input.budgetTokens ?? 8000,
    format
  }
}

// ============================================================
// Bucketize candidates por tipo
// ============================================================

type Buckets = {
  persona?: Block
  tone?: Block
  output_format?: Block
  instructions: Block[]
  rules: Block[]
  facts: Block[]
  memories: Block[]
  examples: Block[]
  knowledge: Block[]
  sources: Array<{ id: string; title: string; type: string; ref?: string }>
}

function bucketize(selected: Candidate[]): Buckets {
  const b: Buckets = {
    instructions: [],
    rules: [],
    facts: [],
    memories: [],
    examples: [],
    knowledge: [],
    sources: []
  }
  for (const c of selected) {
    const block: Block = {
      title: c.title,
      content: c.content,
      source_id: c.id
    }
    switch (c.type) {
      case 'persona':
        b.persona = block
        break
      case 'output_template':
        b.output_format = block
        break
      case 'rule':
        b.rules.push(block)
        break
      case 'context_block':
        b.facts.push(block)
        break
      case 'knowledge':
        b.knowledge.push(block)
        break
      case 'document':
        b.sources.push({ id: c.id, title: c.title, type: 'document' })
        break
      case 'chunk':
        b.knowledge.push(block)
        if (c.sourceRefId) {
          b.sources.push({ id: c.sourceRefId, title: c.title, type: 'document' })
        }
        break
      default:
        if (c.type.startsWith('memory:')) {
          b.memories.push(block)
        } else {
          b.facts.push(block)
        }
    }
  }
  return b
}

// ============================================================
// Formats
// ============================================================

function buildJson(meta: CommonPackageMeta, b: Buckets, req: RequestEcho) {
  return {
    ...meta,
    request: req,
    persona: b.persona,
    tone: b.tone,
    output_format: b.output_format,
    instructions: b.instructions,
    rules: b.rules,
    facts: [...b.facts, ...b.knowledge],
    memories: b.memories,
    examples: b.examples,
    sources: b.sources
  }
}

function buildMarkdown(
  meta: CommonPackageMeta,
  b: Buckets,
  _req: RequestEcho,
  userQuery: string
) {
  const parts: string[] = []

  if (b.persona) {
    parts.push(`# Persona\n${b.persona.content}`)
  }
  if (b.tone) {
    parts.push(`# Tom de voz\n${b.tone.content}`)
  }
  if (b.output_format) {
    parts.push(`# Formato de output\n${b.output_format.content}`)
  }
  if (b.rules.length > 0) {
    parts.push(`# Regras\n${b.rules.map((r) => `- ${r.content}`).join('\n')}`)
  }
  if (b.instructions.length > 0) {
    parts.push(
      `# Instruções\n${b.instructions.map((i) => `- ${i.content}`).join('\n')}`
    )
  }
  if (b.facts.length > 0 || b.knowledge.length > 0) {
    parts.push(
      `# Fatos\n${[...b.facts, ...b.knowledge].map((f) => `- ${f.content}`).join('\n\n')}`
    )
  }
  if (b.memories.length > 0) {
    parts.push(
      `# Memórias\n${b.memories.map((m) => `- ${m.content}`).join('\n')}`
    )
  }
  if (b.examples.length > 0) {
    parts.push(
      `# Exemplos\n${b.examples.map((e) => e.content).join('\n\n')}`
    )
  }
  parts.push(`# Tarefa\n${userQuery}`)

  return {
    ...meta,
    markdown: parts.join('\n\n')
  }
}

function buildMessages(
  meta: CommonPackageMeta,
  b: Buckets,
  req: RequestEcho,
  userQuery: string
) {
  const systemA: string[] = []
  if (b.persona) systemA.push(`# Persona\n${b.persona.content}`)
  if (b.tone) systemA.push(`# Tom\n${b.tone.content}`)
  if (b.output_format) systemA.push(`# Formato\n${b.output_format.content}`)
  if (b.rules.length > 0)
    systemA.push(`# Regras\n${b.rules.map((r) => `- ${r.content}`).join('\n')}`)
  if (b.instructions.length > 0)
    systemA.push(
      `# Instruções\n${b.instructions.map((i) => `- ${i.content}`).join('\n')}`
    )

  const systemB: string[] = []
  if (b.facts.length > 0 || b.knowledge.length > 0) {
    systemB.push(
      `# Fatos\n${[...b.facts, ...b.knowledge].map((f) => `- ${f.content}`).join('\n\n')}`
    )
  }
  if (b.memories.length > 0) {
    systemB.push(
      `# Memórias\n${b.memories.map((m) => `- ${m.content}`).join('\n')}`
    )
  }
  if (b.examples.length > 0) {
    systemB.push(`# Exemplos\n${b.examples.map((e) => e.content).join('\n\n')}`)
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = []
  if (systemA.length > 0) messages.push({ role: 'system', content: systemA.join('\n\n') })
  if (systemB.length > 0) messages.push({ role: 'system', content: systemB.join('\n\n') })
  messages.push({ role: 'user', content: userQuery })

  return {
    ...meta,
    request: req,
    messages
  }
}

function buildMcp(
  meta: CommonPackageMeta,
  b: Buckets,
  req: RequestEcho,
  userQuery: string
) {
  const md = buildMarkdown(meta, b, req, userQuery) as { markdown: string }
  return {
    content: [{ type: 'text', text: md.markdown }],
    _meta: {
      package_id: meta.package_id,
      trace_id: meta.trace_id,
      stats: meta.stats
    }
  }
}
