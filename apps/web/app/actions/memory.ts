'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireSession } from '@/lib/guards'
import {
  createMemoryRecord,
  deleteMemoryRecord,
  ensureScopeAccess,
  getMemoryByIdForUser,
  updateMemoryRecord
} from '@/lib/memory'

const CreateSchema = z.object({
  workspaceId: z.string().uuid(),
  scopeType: z.enum(['workspace', 'projeto']),
  scopeId: z.string().uuid(),
  title: z.string().max(200).optional(),
  content: z.string().min(1, 'Conteúdo obrigatório').max(8000)
})

export type CreateMemoryState = { error?: string } | null

export async function createMemoryAction(
  _prev: CreateMemoryState,
  formData: FormData
): Promise<CreateMemoryState> {
  const parsed = CreateSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    scopeType: formData.get('scopeType'),
    scopeId: formData.get('scopeId'),
    title: (formData.get('title') as string) || undefined,
    content: formData.get('content')
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const session = await requireSession()
  const ok = await ensureScopeAccess({
    scopeType: parsed.data.scopeType,
    scopeId: parsed.data.scopeId,
    userId: session.userId
  })
  if (!ok) return { error: 'Sem acesso a esse escopo' }

  await createMemoryRecord({
    scopeType: parsed.data.scopeType,
    scopeId: parsed.data.scopeId,
    title: parsed.data.title,
    content: parsed.data.content
  })

  revalidatePath(`/workspaces/${parsed.data.workspaceId}/memories`)
  return null
}

const DeleteSchema = z.object({
  memoryId: z.string().uuid(),
  workspaceId: z.string().uuid()
})

export async function deleteMemoryAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = DeleteSchema.safeParse({
    memoryId: formData.get('memoryId'),
    workspaceId: formData.get('workspaceId')
  })
  if (!parsed.success) return
  const memory = await getMemoryByIdForUser(parsed.data.memoryId, session.userId)
  if (!memory) return
  await deleteMemoryRecord(memory.id)
  revalidatePath(`/workspaces/${parsed.data.workspaceId}/memories`)
}
