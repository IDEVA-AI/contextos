import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { listBrainsForProject } from '@/lib/brain'
import { compileContext, type CompileInput } from '@/lib/compiler'
import {
  createMemoryRecord,
  ensureScopeAccess,
  searchMemoriesSemantic
} from '@/lib/memory'
import { buildPackage } from '@/lib/package-builder'
import { persistTrace } from '@/lib/trace'
import type { V1Auth } from '@/lib/v1-auth'
import { db, schema } from '@contextos/db'
import { eq } from 'drizzle-orm'

const SERVER_VERSION = '0.1.0-alpha'

export function createMcpServerForAuth(auth: V1Auth): McpServer {
  if (!auth.workspaceId) {
    throw new Error('mcp_requires_workspace_scoped_key')
  }
  const workspaceId = auth.workspaceId

  const server = new McpServer({
    name: 'contextos',
    version: SERVER_VERSION
  })

  // -------------------------------------------------- list_brains
  server.registerTool(
    'list_brains',
    {
      description:
        'Lista cérebros (canvases) disponíveis nesta workspace. Use o id retornado em compile_context/retrieve_context.',
      inputSchema: {}
    },
    async () => {
      const projects = await db
        .select({ id: schema.projects.id, name: schema.projects.name })
        .from(schema.projects)
        .where(eq(schema.projects.workspaceId, workspaceId))

      const brainList = await Promise.all(
        projects.map(async (p) => {
          const brains = await listBrainsForProject(p.id)
          return brains.map((b) => ({
            id: b.id,
            name: b.name,
            project_id: p.id,
            project_name: p.name
          }))
        })
      )
      const flat = brainList.flat()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ brains: flat, total: flat.length }, null, 2)
          }
        ]
      }
    }
  )

  // -------------------------------------------------- retrieve_context
  server.registerTool(
    'retrieve_context',
    {
      description:
        'Busca blocos brutos do cérebro filtrados por escopo + RBAC, rankeados por relevância. Use pra ver o que está disponível sem compilar pacote.',
      inputSchema: {
        brain_id: z
          .string()
          .uuid()
          .optional()
          .describe('UUID do cérebro. Se omitido, busca em todos da workspace.'),
        query: z.string().describe('Query semântica.'),
        task: z.string().optional().describe('Descrição da tarefa (boost ranking).'),
        scope: z
          .array(z.string())
          .optional()
          .describe('Tags de escopo (ex: ["client:delta"]).'),
        limit: z.number().int().min(1).max(50).default(20)
      }
    },
    async (args) => {
      const input: CompileInput = {
        workspaceId,
        brainId: args.brain_id,
        scope: args.scope,
        task: args.task,
        query: args.query,
        format: 'json',
        budgetTokens: 999_999,
        apiKeyScopes: auth.scopes
      }
      const result = await compileContext(input)
      const blocks = result.candidates.slice(0, args.limit).map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        content: c.content,
        priority: c.priority,
        tags: c.tags,
        relevance_score: c.relevanceScore,
        source: c.source
      }))
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { blocks, total: result.candidates.length, warnings: result.stats.warnings },
              null,
              2
            )
          }
        ]
      }
    }
  )

  // -------------------------------------------------- compile_context
  server.registerTool(
    'compile_context',
    {
      description:
        'Compila um pacote de contexto pronto pra usar como input de LLM. Aplica RBAC, ranking, budget de tokens. Default format=markdown ideal pra concatenar em system prompt.',
      inputSchema: {
        brain_id: z.string().uuid().optional(),
        query: z.string().describe('Query/tarefa do consumidor.'),
        task: z.string().optional(),
        scope: z.array(z.string()).optional(),
        format: z
          .enum(['markdown', 'json', 'messages'])
          .default('markdown')
          .describe(
            'markdown=texto pronto pra system prompt, messages=array OpenAI/Anthropic, json=schema canônico.'
          ),
        budget_tokens: z.number().int().min(100).max(50000).default(4000)
      }
    },
    async (args) => {
      const startedAt = Date.now()
      const input: CompileInput = {
        workspaceId,
        brainId: args.brain_id,
        scope: args.scope,
        task: args.task,
        query: args.query,
        format: args.format,
        budgetTokens: args.budget_tokens,
        apiKeyScopes: auth.scopes,
        consumer: 'mcp'
      }
      const result = await compileContext(input)
      const traceId = await persistTrace({
        workspaceId,
        brainId: args.brain_id,
        brainVersionId: result.contextVersionId,
        apiKeyId: auth.apiKeyId,
        endpoint: '/mcp/compile_context',
        requestPayload: args,
        stats: result.stats,
        statusCode: 200,
        durationMs: Date.now() - startedAt
      })
      const pkg = buildPackage({
        input,
        selected: result.selected,
        stats: result.stats,
        traceId,
        contextVersionId: result.contextVersionId
      })
      const text =
        args.format === 'markdown'
          ? (pkg as { markdown: string }).markdown
          : JSON.stringify(pkg, null, 2)
      return {
        content: [{ type: 'text', text }]
      }
    }
  )

  // -------------------------------------------------- search_memory
  server.registerTool(
    'search_memory',
    {
      description:
        'Busca memórias do cérebro por similaridade semântica (ou textual em fallback).',
      inputSchema: {
        scope_type: z
          .enum(['workspace', 'projeto', 'execucao'])
          .default('workspace'),
        scope_id: z
          .string()
          .uuid()
          .optional()
          .describe('Se omitido com scope_type=workspace, usa a workspace da key.'),
        query: z.string(),
        limit: z.number().int().min(1).max(50).default(10)
      }
    },
    async (args) => {
      const scopeId = args.scope_id ?? workspaceId
      const ok = await ensureScopeAccess({
        scopeType: args.scope_type,
        scopeId,
        userId: auth.userId
      })
      if (!ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'forbidden' }) }],
          isError: true
        }
      }
      const hits = await searchMemoriesSemantic({
        scopeType: args.scope_type,
        scopeId,
        query: args.query,
        limit: args.limit
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                memories: hits.map((h) => ({
                  id: h.id,
                  title: h.title,
                  content: h.content,
                  relevance_score: h.relevanceScore,
                  tags: h.tags,
                  created_at: h.createdAt
                })),
                total: hits.length
              },
              null,
              2
            )
          }
        ]
      }
    }
  )

  // -------------------------------------------------- save_memory
  server.registerTool(
    'save_memory',
    {
      description:
        'Salva uma nova memória no cérebro. Use pra preservar aprendizados, decisões, padrões observados.',
      inputSchema: {
        scope_type: z
          .enum(['workspace', 'projeto', 'execucao'])
          .default('workspace'),
        scope_id: z.string().uuid().optional(),
        title: z.string().max(200).optional(),
        content: z.string().min(1).max(8000),
        tags: z.array(z.string()).optional()
      }
    },
    async (args) => {
      const scopeId = args.scope_id ?? workspaceId
      const ok = await ensureScopeAccess({
        scopeType: args.scope_type,
        scopeId,
        userId: auth.userId
      })
      if (!ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'forbidden' }) }],
          isError: true
        }
      }
      const memory = await createMemoryRecord({
        scopeType: args.scope_type,
        scopeId,
        title: args.title,
        content: args.content,
        tags: args.tags
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { id: memory.id, created_at: memory.createdAt, has_embedding: memory.hasEmbedding },
              null,
              2
            )
          }
        ]
      }
    }
  )

  return server
}
