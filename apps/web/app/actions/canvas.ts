'use server'

import { z } from 'zod'

import { requireSession } from '@/lib/guards'
import { getBrainByIdForUser } from '@/lib/brain'
import { saveBrainState } from '@/lib/node'

const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'context_block',
    'persona',
    'rule',
    'memory',
    'document',
    'knowledge',
    'output_template'
  ]),
  title: z.string().min(1).max(200),
  content: z.string().nullable(),
  priority: z.number().int().min(0).max(100),
  scope: z.enum([
    'global',
    'workspace',
    'empresa',
    'projeto',
    'cliente',
    'processo',
    'agente',
    'execucao',
    'temporario'
  ]),
  tags: z.array(z.string()),
  mode: z.enum(['single', 'multi']),
  enabled: z.boolean(),
  positionX: z.number(),
  positionY: z.number(),
  metadata: z.record(z.string(), z.unknown())
})

const EdgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().nullable()
})

const SaveSchema = z.object({
  brainId: z.string().uuid(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema)
})

export type SaveBrainStateInput = z.infer<typeof SaveSchema>
export type SaveBrainStateResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string }

export async function saveBrainStateAction(
  input: SaveBrainStateInput
): Promise<SaveBrainStateResult> {
  const parsed = SaveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const session = await requireSession()
  const brain = await getBrainByIdForUser(parsed.data.brainId, session.userId)
  if (!brain) {
    return { ok: false, error: 'not_found' }
  }
  await saveBrainState({
    brainId: brain.id,
    nodes: parsed.data.nodes,
    edges: parsed.data.edges
  })
  return { ok: true, savedAt: new Date().toISOString() }
}
