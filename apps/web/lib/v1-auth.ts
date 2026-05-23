import { authenticateBearerToken } from './api-key'
import { getCurrentSession } from './session'

export type V1Auth = {
  userId: string
  workspaceId?: string
  apiKeyId?: string
  scopes: string[]
  source: 'api_key' | 'session'
}

/**
 * Tenta Bearer token primeiro (uso externo/IA), fallback cookie session
 * (uso pela própria UI). Quando vem via Bearer, traz scopes da key.
 */
export async function authenticateV1Request(req: Request): Promise<V1Auth | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const key = await authenticateBearerToken(authHeader)
    if (key) {
      return {
        userId: key.userId,
        workspaceId: key.workspaceId,
        apiKeyId: key.id,
        scopes: key.scopes,
        source: 'api_key'
      }
    }
    // Header presente mas token inválido = falha (não cai pra cookie)
    return null
  }
  const session = await getCurrentSession()
  if (session) {
    return {
      userId: session.userId,
      scopes: [],
      source: 'session'
    }
  }
  return null
}
