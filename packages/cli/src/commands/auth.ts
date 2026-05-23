import { Command } from 'commander'
import * as p from '@clack/prompts'

import { apiRequest, ContextOSError } from '../lib/client.js'
import {
  configPath,
  getActiveProfile,
  loadConfig,
  saveConfig,
  setProfile
} from '../lib/config.js'
import { bold, brand, dim, failure, handleError, info, success } from '../lib/output.js'

type AuthOptions = { profile?: string }

async function login(options: { profile?: string; url?: string; key?: string; name?: string }) {
  p.intro(brand('ContextOS — login'))

  const profileName =
    options.name ??
    ((await p.text({
      message: 'Nome do perfil',
      placeholder: 'default',
      defaultValue: 'default'
    })) as string)
  if (p.isCancel(profileName)) {
    p.cancel('Cancelado.')
    process.exit(0)
  }

  const url =
    options.url ??
    ((await p.text({
      message: 'URL do servidor ContextOS',
      placeholder: 'http://localhost:3000',
      defaultValue: 'http://localhost:3000',
      validate: (v) => (v && /^https?:\/\//.test(v) ? undefined : 'URL precisa começar com http:// ou https://')
    })) as string)
  if (p.isCancel(url)) {
    p.cancel('Cancelado.')
    process.exit(0)
  }

  const apiKey =
    options.key ??
    ((await p.password({
      message: 'API key (ctx_sk_live_...)',
      validate: (v) => (v && v.startsWith('ctx_sk_') ? undefined : 'Formato esperado: ctx_sk_...')
    })) as string)
  if (p.isCancel(apiKey)) {
    p.cancel('Cancelado.')
    process.exit(0)
  }

  const spinner = p.spinner()
  spinner.start('Validando chave contra o servidor')
  try {
    // Sem workspace_id ainda — tenta endpoint que só requer Bearer válido.
    // Usamos /v1/brains sem param pra detectar a workspace via erro de validação:
    // se chave for válida, recebemos 400 invalid_input.
    // Se inválida, recebemos 401.
    await apiRequest(
      { name: profileName, url, apiKey },
      { method: 'GET', path: '/v1/brains' }
    )
  } catch (err) {
    if (err instanceof ContextOSError) {
      if (err.status === 401) {
        spinner.stop('Chave inválida ❌')
        p.outro(dim('Crie/copie a chave em Acesso ao Cérebro na UI.'))
        process.exit(1)
      }
      if (err.status === 400) {
        // Esperado — chave válida, só faltou workspace_id.
        spinner.stop('Chave válida ✓')
      } else {
        spinner.stop('Erro inesperado')
        throw err
      }
    } else {
      spinner.stop('Erro de rede')
      throw err
    }
  }

  const config = await loadConfig()
  const next = setProfile(config, profileName, { url, apiKey })
  await saveConfig(next)

  p.outro(`Perfil ${bold(profileName)} salvo em ${dim(configPath())}`)
}

async function whoami(options: AuthOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  console.log(`${bold('Perfil:')} ${profile.name}`)
  console.log(`${bold('URL:')}    ${profile.url}`)
  console.log(`${bold('Chave:')}  ${profile.apiKey.slice(0, 20)}…`)
  if (profile.workspaceId) {
    console.log(`${bold('WS:')}     ${profile.workspaceId}`)
  }
  info(`Config em ${dim(configPath())}`)
}

async function logout(options: { name?: string }) {
  const config = await loadConfig()
  const name = options.name ?? config.defaultProfile
  if (!config.profiles[name]) {
    failure(`Perfil "${name}" não existe.`)
    process.exit(1)
  }
  const { [name]: _removed, ...remaining } = config.profiles
  const nextDefault = Object.keys(remaining)[0] ?? 'default'
  await saveConfig({ defaultProfile: nextDefault, profiles: remaining })
  success(`Perfil ${name} removido.`)
}

export function registerAuthCommands(program: Command): void {
  const cmd = program
    .command('auth')
    .description('Gerenciar login / API key')

  cmd
    .command('login')
    .description('Salvar API key + URL do servidor')
    .option('-n, --name <name>', 'nome do perfil')
    .option('--url <url>', 'URL do servidor (skip prompt)')
    .option('--key <apiKey>', 'API key (skip prompt — cuidado com histórico do shell)')
    .action(login)

  cmd
    .command('whoami')
    .description('Mostrar perfil ativo')
    .option('-p, --profile <name>', 'usar perfil específico')
    .action(whoami)

  cmd
    .command('logout')
    .description('Remover perfil')
    .option('-n, --name <name>', 'nome do perfil (default: ativo)')
    .action(logout)
}
