'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireSession, requireWorkspace } from '@/lib/guards'
import {
  createProject as createProjectLib,
  deleteProject as deleteProjectLib,
  getProjectByIdForUser,
  updateProject as updateProjectLib
} from '@/lib/project'

const CreateSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, 'Nome obrigatório').max(80),
  description: z.string().max(500).optional()
})

export type CreateProjectState = {
  error?: string
} | null

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const parsed = CreateSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { workspace } = await requireWorkspace(parsed.data.workspaceId)

  await createProjectLib({
    workspaceId: workspace.id,
    name: parsed.data.name,
    description: parsed.data.description
  })

  revalidatePath(`/workspaces/${workspace.id}`)
  return null
}

const DeleteSchema = z.object({
  projectId: z.string().uuid()
})

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = DeleteSchema.safeParse({ projectId: formData.get('projectId') })
  if (!parsed.success) return

  const project = await getProjectByIdForUser(parsed.data.projectId, session.userId)
  if (!project) return

  await deleteProjectLib(project.id)
  revalidatePath(`/workspaces/${project.workspaceId}`)
}
