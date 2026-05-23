'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { db, schema } from '@contextos/db'
import { createBrain } from '@/lib/brain'
import { requireSession } from '@/lib/guards'
import { getProjectByIdForUser } from '@/lib/project'
import { getTemplate } from '@/lib/templates'

const FromTemplateSchema = z.object({
  projectId: z.string().uuid(),
  templateId: z.string().min(1),
  name: z.string().max(80).optional()
})

export type CreateBrainFromTemplateResult =
  | { ok: true; brainId: string }
  | { ok: false; error: string }

export async function createBrainFromTemplateAction(
  formData: FormData
): Promise<void> {
  const parsed = FromTemplateSchema.safeParse({
    projectId: formData.get('projectId'),
    templateId: formData.get('templateId'),
    name: (formData.get('name') as string) || undefined
  })
  if (!parsed.success) return

  const session = await requireSession()
  const project = await getProjectByIdForUser(parsed.data.projectId, session.userId)
  if (!project) return

  const template = getTemplate(parsed.data.templateId)
  if (!template) return

  const brain = await createBrain({
    projectId: project.id,
    name: parsed.data.name ?? template.name,
    description: template.description
  })

  if (template.nodes.length > 0) {
    await db.insert(schema.nodes).values(
      template.nodes.map((n) => ({
        brainId: brain.id,
        type: n.type,
        title: n.title,
        content: n.content,
        priority: n.priority,
        scope: n.scope,
        tags: n.tags,
        mode: n.mode,
        positionX: n.positionX,
        positionY: n.positionY
      }))
    )
  }

  revalidatePath(`/workspaces/${project.workspaceId}`)
  redirect(`/brains/${brain.id}`)
}
