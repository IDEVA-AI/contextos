/**
 * Abstração de provider LLM pro ContextOS.
 *
 * Encapsula qualquer backend (claude-bridge, API key Anthropic, OpenAI, futuro OAuth).
 * Endpoints `/chat` e `/test` chamam `getProvider().generate({system, messages})` em vez
 * de SDK específico. Trocar de provider = mudar resolução em `getProvider()`.
 *
 * MVP atual (Sprint 12): provider único via env vars no stack. Cliente externo BYO LLM
 * entra em sprint futura como `llm_provider_config jsonb` por workspace.
 *
 * Hierarquia de seleção (primeiro que matchar):
 *   1. CLAUDE_BRIDGE_URL → ClaudeBridgeProvider (zero custo, subscription Julio)
 *   2. ANTHROPIC_API_KEY → AnthropicProvider (futuro)
 *   3. OPENAI_API_KEY    → OpenAIProvider (futuro)
 *   4. nenhum            → throw NoProviderError (HTTP 503 no endpoint)
 */

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type GenerateInput = {
  system: string
  messages: ChatMessage[]
}

export type GenerateOutput = {
  text: string
  provider: string
  model: string
  duration_ms: number
}

export class NoProviderError extends Error {
  constructor() {
    super(
      'no_provider: configure CLAUDE_BRIDGE_URL, ANTHROPIC_API_KEY ou OPENAI_API_KEY no .env.stack'
    )
    this.name = 'NoProviderError'
  }
}

export interface LLMProvider {
  readonly name: string
  readonly model: string
  generate(input: GenerateInput): Promise<GenerateOutput>
}

// ============================================================
// CLAUDE BRIDGE — proxy local pra sessão Claude Code do host
// ============================================================
// API do bridge (server.js em /root/projetos/sitebuilder/claude-bridge):
//   POST /generate  body { prompt: string }
//   200 { text: string, duration_ms: number }
//   500 { error: string }
// Single-shot, sem streaming, sem messages array — precisa serializar tudo em 1 prompt.

class ClaudeBridgeProvider implements LLMProvider {
  readonly name = 'claude-bridge'
  readonly model: string
  private readonly url: string

  constructor(url: string, model = 'claude-bridge-default') {
    this.url = url
    this.model = model
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const prompt = serializeForBridge(input)
    const startedAt = Date.now()

    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`claude-bridge ${res.status}: ${body.slice(0, 200)}`)
    }

    const data = (await res.json()) as { text?: string; duration_ms?: number; error?: string }
    if (data.error) {
      throw new Error(`claude-bridge error: ${data.error.slice(0, 200)}`)
    }
    if (!data.text) {
      throw new Error('claude-bridge: empty response')
    }

    return {
      text: data.text,
      provider: this.name,
      model: this.model,
      duration_ms: data.duration_ms ?? Date.now() - startedAt
    }
  }
}

/**
 * Bridge aceita 1 prompt string. Serializa system + histórico num formato que
 * Claude Code interpreta bem como "conversa com persona + regras".
 */
function serializeForBridge({ system, messages }: GenerateInput): string {
  const lines: string[] = []

  if (system.trim()) {
    lines.push('=== CONTEXTO DO AGENTE ===')
    lines.push(system.trim())
    lines.push('=== FIM DO CONTEXTO ===')
    lines.push('')
  }

  if (messages.length > 1) {
    lines.push('=== HISTÓRICO DA CONVERSA ===')
    for (const m of messages.slice(0, -1)) {
      const label = m.role === 'user' ? 'Usuário' : 'Assistente'
      lines.push(`[${label}]`)
      lines.push(m.content.trim())
      lines.push('')
    }
    lines.push('=== FIM DO HISTÓRICO ===')
    lines.push('')
  }

  const last = messages[messages.length - 1]
  if (last) {
    lines.push('=== MENSAGEM ATUAL ===')
    lines.push(last.content.trim())
    lines.push('')
    lines.push(
      'Responda como o agente descrito no contexto, em português, seguindo todas as regras. Use o histórico pra manter coerência.'
    )
  }

  return lines.join('\n')
}

// ============================================================
// Providers futuros (placeholders comentados — descomentar quando ativar)
// ============================================================

/*
import Anthropic from '@anthropic-ai/sdk'
class AnthropicAPIKeyProvider implements LLMProvider {
  readonly name = 'anthropic-api'
  readonly model: string
  private readonly client: Anthropic

  constructor(apiKey: string, model = 'claude-haiku-4-5-20251001') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async generate({ system, messages }: GenerateInput): Promise<GenerateOutput> {
    const start = Date.now()
    const result = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    })
    const first = result.content[0]
    const text = first?.type === 'text' ? first.text : '[resposta não-textual]'
    return { text, provider: this.name, model: this.model, duration_ms: Date.now() - start }
  }
}
*/

// ============================================================
// Resolução
// ============================================================

let cached: LLMProvider | null = null

export function getProvider(): LLMProvider {
  if (cached) return cached

  const bridgeUrl = process.env.CLAUDE_BRIDGE_URL
  if (bridgeUrl) {
    const model = process.env.CLAUDE_BRIDGE_MODEL ?? 'claude-bridge-default'
    cached = new ClaudeBridgeProvider(bridgeUrl, model)
    return cached
  }

  // Placeholders pra futuro:
  // if (process.env.ANTHROPIC_API_KEY) {
  //   cached = new AnthropicAPIKeyProvider(...)
  //   return cached
  // }
  // if (process.env.OPENAI_API_KEY) { ... }

  throw new NoProviderError()
}

export function resetProviderCache(): void {
  cached = null
}
