'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  createApiKey,
  getApiKeyByIdForUser,
  revokeApiKey,
  updateApiKeyScopes
} from '@/lib/api-key'
import { requireSession } from '@/lib/guards'
import { getWorkspaceByIdForUser } from '@/lib/workspace'

const CreateSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, 'Nome obrigatório').max(80),
  scopes: z.string().max(500).optional() // comma-separated
})

export type CreateApiKeyResult =
  | { ok: true; id: string; name: string; secret: string; scopes: string[] }
  | { ok: false; error: string }

export async function createApiKeyAction(
  formData: FormData
): Promise<CreateApiKeyResult> {
  const parsed = CreateSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    name: formData.get('name'),
    scopes: formData.get('scopes') ?? ''
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const session = await requireSession()
  const ws = await getWorkspaceByIdForUser(parsed.data.workspaceId, session.userId)
  if (!ws) return { ok: false, error: 'Workspace não encontrado' }

  const scopes = (parsed.data.scopes ?? '')
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const { summary, secret } = await createApiKey({
    workspaceId: ws.id,
    name: parsed.data.name,
    scopes,
    userId: session.userId
  })

  revalidatePath(`/workspaces/${ws.id}/access`)

  return {
    ok: true,
    id: summary.id,
    name: summary.name,
    secret,
    scopes: summary.scopes
  }
}

const RevokeSchema = z.object({
  keyId: z.string().uuid(),
  workspaceId: z.string().uuid()
})

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = RevokeSchema.safeParse({
    keyId: formData.get('keyId'),
    workspaceId: formData.get('workspaceId')
  })
  if (!parsed.success) return
  const key = await getApiKeyByIdForUser(parsed.data.keyId, session.userId)
  if (!key) return
  await revokeApiKey(key.id)
  revalidatePath(`/workspaces/${parsed.data.workspaceId}/access`)
}

const UpdateScopesSchema = z.object({
  keyId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  scopes: z.string().max(500)
})

export async function updateApiKeyScopesAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = UpdateScopesSchema.safeParse({
    keyId: formData.get('keyId'),
    workspaceId: formData.get('workspaceId'),
    scopes: formData.get('scopes')
  })
  if (!parsed.success) return
  const key = await getApiKeyByIdForUser(parsed.data.keyId, session.userId)
  if (!key) return
  const scopes = parsed.data.scopes
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  await updateApiKeyScopes({ keyId: key.id, scopes })
  revalidatePath(`/workspaces/${parsed.data.workspaceId}/access`)
}
