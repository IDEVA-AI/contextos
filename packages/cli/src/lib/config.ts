import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type Profile = {
  url: string
  apiKey: string
  workspaceId?: string
  workspaceSlug?: string
}

export type Config = {
  defaultProfile: string
  profiles: Record<string, Profile>
}

const CONFIG_DIR = join(homedir(), '.contextos')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const EMPTY_CONFIG: Config = {
  defaultProfile: 'default',
  profiles: {}
}

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<Config>
    return {
      defaultProfile: parsed.defaultProfile ?? 'default',
      profiles: parsed.profiles ?? {}
    }
  } catch {
    return { ...EMPTY_CONFIG }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
  // chmod 600 — chave fica em plaintext, restringe ao dono
  await chmod(CONFIG_PATH, 0o600).catch(() => {})
}

export type ResolvedProfile = Profile & { name: string }

export function getActiveProfile(
  config: Config,
  override?: string
): ResolvedProfile {
  const overrideUrl = process.env.CONTEXTOS_URL
  const overrideKey = process.env.CONTEXTOS_API_KEY
  if (overrideUrl && overrideKey) {
    return {
      name: 'env',
      url: overrideUrl,
      apiKey: overrideKey,
      workspaceId: process.env.CONTEXTOS_WORKSPACE_ID
    }
  }
  const name = override ?? process.env.CONTEXTOS_PROFILE ?? config.defaultProfile
  const profile = config.profiles[name]
  if (!profile) {
    throw new Error(
      `Perfil "${name}" não encontrado. Rode \`contextos auth login\` primeiro.`
    )
  }
  return { name, ...profile }
}

export function setProfile(
  config: Config,
  name: string,
  profile: Profile
): Config {
  return {
    defaultProfile: name,
    profiles: { ...config.profiles, [name]: profile }
  }
}

export function configPath(): string {
  return CONFIG_PATH
}
