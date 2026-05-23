import { Command } from 'commander'

import { apiRequest } from '../lib/client.js'
import { getActiveProfile, loadConfig } from '../lib/config.js'
import {
  bold,
  brand,
  dim,
  handleError,
  info,
  printJson,
  warn
} from '../lib/output.js'

type CompileOptions = {
  profile?: string
  workspace?: string
  query: string
  task?: string
  format: 'json' | 'messages' | 'markdown' | 'mcp'
  budget?: string
  scope?: string[]
  json?: boolean
}

type RetrieveOptions = {
  profile?: string
  workspace?: string
  query: string
  task?: string
  topK?: string
  scope?: string[]
  json?: boolean
}

function requireWorkspace(
  options: { workspace?: string },
  profileWs?: string
): string {
  const ws = options.workspace ?? profileWs ?? process.env.CONTEXTOS_WORKSPACE_ID
  if (!ws) {
    handleError(
      new Error(
        'workspace_id obrigatório. Use --workspace <id> ou defina CONTEXTOS_WORKSPACE_ID.'
      )
    )
  }
  return ws
}

async function compile(brainId: string, options: CompileOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  const workspaceId = requireWorkspace(options, profile.workspaceId)

  const body: Record<string, unknown> = {
    workspace_id: workspaceId,
    brain_id: brainId,
    query: options.query,
    format: options.format
  }
  if (options.task) body.task = options.task
  if (options.budget) body.budget_tokens = Number(options.budget)
  if (options.scope?.length) body.scope = options.scope

  try {
    const pkg = (await apiRequest<Record<string, unknown>>(profile, {
      method: 'POST',
      path: '/v1/context/compile',
      json: body
    }))

    if (options.json) {
      printJson(pkg)
      return
    }

    const stats = (pkg.stats ?? {}) as Record<string, unknown>
    console.log(bold('Stats'))
    console.log(`  tokens:   ${brand(String(stats.tokensEstimated ?? '?'))}`)
    console.log(`  blocos:   ${stats.blocksIncluded ?? '?'}/${stats.blocksConsidered ?? '?'}`)
    console.log(`  trace:    ${dim(String(pkg.trace_id ?? ''))}`)
    const warnings = (stats.warnings ?? []) as string[]
    if (warnings.length) {
      for (const w of warnings) warn(w)
    }
    console.log()
    if (options.format === 'markdown' && typeof pkg.markdown === 'string') {
      console.log(pkg.markdown)
    } else if (options.format === 'messages' && Array.isArray(pkg.messages)) {
      printJson(pkg.messages)
    } else if (options.format === 'mcp') {
      printJson(pkg.mcp ?? pkg)
    } else {
      printJson(pkg)
    }
    info(`Pacote no formato ${bold(options.format)}.`)
  } catch (err) {
    handleError(err)
  }
}

async function retrieve(brainId: string, options: RetrieveOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  const workspaceId = requireWorkspace(options, profile.workspaceId)

  const body: Record<string, unknown> = {
    workspace_id: workspaceId,
    brain_id: brainId,
    query: options.query
  }
  if (options.task) body.task = options.task
  if (options.topK) body.limit = Number(options.topK)
  if (options.scope?.length) body.scope = options.scope

  try {
    const data = await apiRequest<{
      blocks: Array<{
        id: string
        type: string
        title: string | null
        content: string
        priority: number
        scope: string
        tags: string[]
        relevance_score: number
        source: string
      }>
      total: number
      warnings: string[]
    }>(profile, {
      method: 'POST',
      path: '/v1/context/retrieve',
      json: body
    })

    if (options.json) {
      printJson(data)
      return
    }

    console.log(bold(`Blocos rankeados (${data.total})`))
    for (const b of data.blocks) {
      const score = brand(b.relevance_score.toFixed(2))
      const prio = dim(`p${b.priority}`)
      const title = b.title ?? '(sem título)'
      console.log(`\n  ${bold(`[${b.type}]`)} ${title}  ${score} ${prio}`)
      const preview = b.content.length > 160 ? `${b.content.slice(0, 160)}…` : b.content
      console.log(`    ${dim(preview)}`)
    }
    if (data.warnings.length) {
      console.log()
      for (const w of data.warnings) warn(w)
    }
  } catch (err) {
    handleError(err)
  }
}

export function registerContextCommands(program: Command): void {
  program
    .command('compile <brainId>')
    .description('Compilar pacote de contexto a partir do cérebro')
    .requiredOption('-q, --query <text>', 'query (obrigatório)')
    .option('-w, --workspace <id>', 'workspace id')
    .option('-p, --profile <name>', 'perfil')
    .option('-t, --task <task>', 'descrição da tarefa')
    .option(
      '-f, --format <fmt>',
      'json | messages | markdown | mcp',
      'markdown'
    )
    .option('-b, --budget <tokens>', 'budget de tokens (padrão: server)')
    .option('--scope <tag...>', 'tags de escopo (repete)')
    .option('--json', 'output JSON cru do pacote inteiro')
    .action(compile)

  program
    .command('retrieve <brainId>')
    .description('Buscar blocos rankeados sem compilar pacote')
    .requiredOption('-q, --query <text>', 'query (obrigatório)')
    .option('-w, --workspace <id>', 'workspace id')
    .option('-p, --profile <name>', 'perfil')
    .option('-t, --task <task>', 'descrição da tarefa')
    .option('-k, --top-k <n>', 'limite de blocos (default 50)')
    .option('--scope <tag...>', 'tags de escopo')
    .option('--json', 'output JSON cru')
    .action(retrieve)
}
