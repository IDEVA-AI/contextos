'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getBrainByIdForUser } from '@/lib/brain'
import { requireSession } from '@/lib/guards'
import { createSnapshot, restoreVersion } from '@/lib/version'

const CreateSchema = z.object({
  brainId: z.string().uuid(),
  description: z.string().max(200).optional()
})

export type CreateSnapshotResult =
  | { ok: true; versionId: string }
  | { ok: false; error: string }

export async function createSnapshotAction(
  input: z.infer<typeof CreateSchema>
): Promise<CreateSnapshotResult> {
  const parsed = CreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const session = await requireSession()
  const brain = await getBrainByIdForUser(parsed.data.brainId, session.userId)
  if (!brain) return { ok: false, error: 'not_found' }

  const version = await createSnapshot({
    brainId: brain.id,
    userId: session.userId,
    description: parsed.data.description
  })

  revalidatePath(`/brains/${brain.id}`)
  return { ok: true, versionId: version.id }
}

const RestoreSchema = z.object({
  brainId: z.string().uuid(),
  versionId: z.string().uuid()
})

export type RestoreResult =
  | { ok: true; newVersionId: string }
  | { ok: false; error: string }

export async function restoreVersionAction(
  input: z.infer<typeof RestoreSchema>
): Promise<RestoreResult> {
  const parsed = RestoreSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const session = await requireSession()
  const brain = await getBrainByIdForUser(parsed.data.brainId, session.userId)
  if (!brain) return { ok: false, error: 'not_found' }

  const newVersion = await restoreVersion({
    versionId: parsed.data.versionId,
    brainId: brain.id,
    userId: session.userId
  })

  if (!newVersion) return { ok: false, error: 'version_not_found' }

  revalidatePath(`/brains/${brain.id}`)
  return { ok: true, newVersionId: newVersion.id }
}
