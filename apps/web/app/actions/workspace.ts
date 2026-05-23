'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireSession } from '@/lib/guards'
import {
  createWorkspace as createWorkspaceLib,
  deleteWorkspace as deleteWorkspaceLib,
  renameWorkspace as renameWorkspaceLib
} from '@/lib/workspace'

const CreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(80)
})

export type CreateWorkspaceState = {
  error?: string
} | null

export async function createWorkspaceAction(
  _prev: CreateWorkspaceState,
  formData: FormData
): Promise<CreateWorkspaceState> {
  const session = await requireSession()
  const parsed = CreateSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const workspace = await createWorkspaceLib({
    ownerId: session.userId,
    name: parsed.data.name
  })

  revalidatePath('/dashboard')
  redirect(`/workspaces/${workspace.id}`)
}

const RenameSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(80)
})

export async function renameWorkspaceAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = RenameSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    name: formData.get('name')
  })
  if (!parsed.success) return

  await renameWorkspaceLib({
    workspaceId: parsed.data.workspaceId,
    ownerId: session.userId,
    name: parsed.data.name
  })
  revalidatePath('/dashboard')
  revalidatePath(`/workspaces/${parsed.data.workspaceId}`)
}

const DeleteSchema = z.object({
  workspaceId: z.string().uuid()
})

export async function deleteWorkspaceAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = DeleteSchema.safeParse({
    workspaceId: formData.get('workspaceId')
  })
  if (!parsed.success) return

  await deleteWorkspaceLib({
    workspaceId: parsed.data.workspaceId,
    ownerId: session.userId
  })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
