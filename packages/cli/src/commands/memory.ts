import { Command } from 'commander'

import { apiRequest } from '../lib/client.js'
import { getActiveProfile, loadConfig } from '../lib/config.js'
import {
  bold,
  brand,
  dim,
  handleError,
  printJson,
  shortId,
  table
} from '../lib/output.js'

type SearchOptions = {
  profile?: string
  workspace: string
  scopeType: 'workspace' | 'projeto' | 'execucao'
  scopeId: string
  query: string
  limit?: string
  json?: boolean
}

type CreateOptions = {
  profile?: string
  workspace: string
  scopeType: 'workspace' | 'projeto' | 'execucao'
  scopeId: string
  title?: string
  content?: string
  tags?: string[]
  json?: boolean
}

async function search(options: SearchOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  try {
    const data = await apiRequest<{
      memories: Array<{
        id: string
        title: string | null
        content: string
        relevance_score: number
        tags: string[]
        created_at: string
      }>
      total: number
    }>(profile, {
      method: 'POST',
      path: '/v1/memory/search',
      json: {
        workspace_id: options.workspace,
        scope_type: options.scopeType,
        scope_id: options.scopeId,
        query: options.query,
        limit: options.limit ? Number(options.limit) : 10
      }
    })
    if (options.json) {
      printJson(data)
      return
    }
    console.log(bold(`Memórias (${data.total})`))
    for (const m of data.memories) {
      const score = brand(m.relevance_score.toFixed(2))
      console.log(`\n  ${bold(m.title ?? '(sem título)')}  ${score}`)
      const preview = m.content.length > 200 ? `${m.content.slice(0, 200)}…` : m.content
      console.log(`    ${dim(preview)}`)
      if (m.tags.length) {
        console.log(`    ${dim(`tags: ${m.tags.join(', ')}`)}`)
      }
    }
  } catch (err) {
    handleError(err)
  }
}

async function create(options: CreateOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  let content = options.content
  if (!content) {
    // Lê stdin se não vier via flag
    content = await readStdin()
    if (!content) {
      handleError(
        new Error('--content obrigatório (ou redirecione conteúdo via stdin).')
      )
    }
  }
  try {
    const data = await apiRequest<{ id: string; created_at: string }>(profile, {
      method: 'POST',
      path: '/v1/memory/create',
      json: {
        workspace_id: options.workspace,
        scope_type: options.scopeType,
        scope_id: options.scopeId,
        title: options.title,
        content,
        tags: options.tags ?? []
      }
    })
    if (options.json) {
      printJson(data)
      return
    }
    table(
      [{ id: shortId(data.id), created: data.created_at }],
      [
        { key: 'id', label: 'ID' },
        { key: 'created', label: 'CRIADA EM' }
      ]
    )
  } catch (err) {
    handleError(err)
  }
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

export function registerMemoryCommands(program: Command): void {
  const cmd = program.command('memory').description('Memórias indexáveis')

  cmd
    .command('search')
    .description('Busca semântica em memórias')
    .requiredOption('-w, --workspace <id>', 'workspace id')
    .requiredOption(
      '--scope-type <type>',
      'workspace | projeto | execucao'
    )
    .requiredOption('--scope-id <id>', 'id do escopo (workspace/projeto/execução)')
    .requiredOption('-q, --query <text>', 'query')
    .option('-l, --limit <n>', 'máx resultados (default 10)')
    .option('-p, --profile <name>', 'perfil')
    .option('--json', 'output JSON cru')
    .action(search)

  cmd
    .command('create')
    .description('Criar memória (lê stdin se --content omitido)')
    .requiredOption('-w, --workspace <id>', 'workspace id')
    .requiredOption(
      '--scope-type <type>',
      'workspace | projeto | execucao'
    )
    .requiredOption('--scope-id <id>', 'id do escopo')
    .option('--title <title>', 'título opcional')
    .option('--content <content>', 'conteúdo (default: stdin)')
    .option('--tags <tag...>', 'tags (repete)')
    .option('-p, --profile <name>', 'perfil')
    .option('--json', 'output JSON cru')
    .action(create)
}
