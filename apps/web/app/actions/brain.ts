'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireSession } from '@/lib/guards'
import { requireProject } from '@/lib/project-guard'
import {
  createBrain as createBrainLib,
  deleteBrain as deleteBrainLib,
  getBrainByIdForUser,
  updateBrain as updateBrainLib
} from '@/lib/brain'

const CreateSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Nome obrigatório').max(80),
  description: z.string().max(500).optional()
})

export type CreateBrainState = { error?: string } | null

export async function createBrainAction(
  _prev: CreateBrainState,
  formData: FormData
): Promise<CreateBrainState> {
  const parsed = CreateSchema.safeParse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { project } = await requireProject(parsed.data.projectId)
  const brain = await createBrainLib({
    projectId: project.id,
    name: parsed.data.name,
    description: parsed.data.description
  })
  revalidatePath(`/workspaces/${project.workspaceId}`)
  redirect(`/brains/${brain.id}`)
}

const DeleteSchema = z.object({ brainId: z.string().uuid() })

export async function deleteBrainAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = DeleteSchema.safeParse({ brainId: formData.get('brainId') })
  if (!parsed.success) return
  const brain = await getBrainByIdForUser(parsed.data.brainId, session.userId)
  if (!brain) return
  await deleteBrainLib(brain.id)
  revalidatePath(`/workspaces/${brain.workspaceId}`)
}

const RenameSchema = z.object({
  brainId: z.string().uuid(),
  name: z.string().min(1).max(80)
})

export async function renameBrainAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = RenameSchema.safeParse({
    brainId: formData.get('brainId'),
    name: formData.get('name')
  })
  if (!parsed.success) return
  const brain = await getBrainByIdForUser(parsed.data.brainId, session.userId)
  if (!brain) return
  await updateBrainLib({ brainId: brain.id, name: parsed.data.name })
  revalidatePath(`/workspaces/${brain.workspaceId}`)
  revalidatePath(`/brains/${brain.id}`)
}
