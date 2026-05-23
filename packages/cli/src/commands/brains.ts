import { Command } from 'commander'

import { apiRequest } from '../lib/client.js'
import { getActiveProfile, loadConfig } from '../lib/config.js'
import {
  bold,
  formatDate,
  handleError,
  printJson,
  shortId,
  table
} from '../lib/output.js'

type ListOptions = {
  profile?: string
  workspace?: string
  json?: boolean
}

type BrainEntry = {
  id: string
  name: string
  description: string | null
  project_id: string
  project_name: string
  current_version_id: string | null
  created_at: string
  updated_at: string
}

type BrainsResponse = {
  workspace_id: string
  brains: BrainEntry[]
  total: number
}

async function list(options: ListOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }

  const workspaceId =
    options.workspace ??
    profile.workspaceId ??
    process.env.CONTEXTOS_WORKSPACE_ID
  if (!workspaceId) {
    handleError(
      new Error(
        'workspace_id obrigatório. Passe --workspace <id> ou defina CONTEXTOS_WORKSPACE_ID.'
      )
    )
  }

  try {
    const data = await apiRequest<BrainsResponse>(profile, {
      method: 'GET',
      path: `/v1/brains?workspace_id=${encodeURIComponent(workspaceId)}`
    })
    if (options.json) {
      printJson(data)
      return
    }
    console.log(bold(`Cérebros (${data.total})`))
    table(
      data.brains.map((b) => ({
        id: shortId(b.id),
        name: b.name,
        project: b.project_name,
        version: shortId(b.current_version_id),
        updated: formatDate(b.updated_at)
      })),
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'NOME' },
        { key: 'project', label: 'PROJETO' },
        { key: 'version', label: 'VERSÃO' },
        { key: 'updated', label: 'ATUALIZADO' }
      ]
    )
  } catch (err) {
    handleError(err)
  }
}

export function registerBrainsCommands(program: Command): void {
  const cmd = program.command('brains').description('Listar cérebros')

  cmd
    .command('list')
    .description('Listar cérebros do workspace')
    .option('-p, --profile <name>', 'perfil')
    .option('-w, --workspace <id>', 'workspace id (default: do perfil ou env)')
    .option('--json', 'output JSON cru')
    .action(list)
}
