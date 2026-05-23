import type { ResolvedProfile } from './config.js'

export type ApiError = {
  status: number
  body: unknown
}

export class ContextOSError extends Error {
  readonly status: number
  readonly body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => ({}))
  }
  return res.text().catch(() => '')
}

function describeError(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const b = body as { error?: string; message?: string }
    if (b.error) return b.message ? `${b.error}: ${b.message}` : b.error
    if (b.message) return b.message
  }
  return typeof body === 'string' && body.length > 0 ? body : 'unknown'
}

type FetchBody = RequestInit['body']

export async function apiRequest<T = unknown>(
  profile: ResolvedProfile,
  init: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    path: string
    json?: unknown
    body?: FetchBody
    headers?: Record<string, string>
  }
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${profile.apiKey}`,
    ...(init.headers ?? {})
  }
  let body: FetchBody = init.body
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(init.json)
  }
  const url = joinUrl(profile.url, init.path)
  let res: Response
  try {
    res = await fetch(url, { method: init.method, headers, body })
  } catch (err) {
    throw new ContextOSError(
      0,
      null,
      `Falha de rede contactando ${url}: ${err instanceof Error ? err.message : 'unknown'}`
    )
  }
  const payload = await parseResponse(res)
  if (!res.ok) {
    throw new ContextOSError(
      res.status,
      payload,
      `HTTP ${res.status}: ${describeError(payload)}`
    )
  }
  return payload as T
}
