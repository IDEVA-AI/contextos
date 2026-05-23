import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import { listEdgesForBrain, listNodesForBrain, saveBrainState } from './node'

export type VersionSummary = {
  id: string
  brainId: string
  description: string | null
  createdBy: string
  createdAt: Date
  nodeCount: number
  edgeCount: number
}

export type SnapshotPayload = {
  nodes: Array<{
    id: string
    type: schema.Node['type']
    title: string
    content: string | null
    priority: number
    scope: schema.Node['scope']
    tags: string[]
    mode: 'single' | 'multi'
    enabled: boolean
    positionX: number
    positionY: number
    metadata: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    sourceNodeId: string
    targetNodeId: string
    label: string | null
  }>
}

export async function listVersionsForBrain(
  brainId: string
): Promise<VersionSummary[]> {
  const rows = await db
    .select({
      id: schema.brainVersions.id,
      brainId: schema.brainVersions.brainId,
      snapshot: schema.brainVersions.snapshot,
      description: schema.brainVersions.description,
      createdBy: schema.brainVersions.createdBy,
      createdAt: schema.brainVersions.createdAt
    })
    .from(schema.brainVersions)
    .where(eq(schema.brainVersions.brainId, brainId))
    .orderBy(desc(schema.brainVersions.createdAt))

  return rows.map((row) => {
    const snap = row.snapshot as SnapshotPayload
    return {
      id: row.id,
      brainId: row.brainId,
      description: row.description,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      nodeCount: snap.nodes?.length ?? 0,
      edgeCount: snap.edges?.length ?? 0
    }
  })
}

export async function createSnapshot(params: {
  brainId: string
  userId: string
  description?: string
}): Promise<VersionSummary> {
  const [nodes, edges] = await Promise.all([
    listNodesForBrain(params.brainId),
    listEdgesForBrain(params.brainId)
  ])

  const snapshot: SnapshotPayload = {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type as schema.Node['type'],
      title: n.data.title,
      content: n.data.content,
      priority: n.data.priority,
      scope: n.data.scope,
      tags: n.data.tags,
      mode: n.data.mode,
      enabled: n.data.enabled,
      positionX: Math.round(n.position.x),
      positionY: Math.round(n.position.y),
      metadata: n.data.metadata
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      label: (e.label as string | undefined) ?? null
    }))
  }

  const [row] = await db
    .insert(schema.brainVersions)
    .values({
      brainId: params.brainId,
      snapshot,
      description: params.description ?? null,
      createdBy: params.userId
    })
    .returning({
      id: schema.brainVersions.id,
      brainId: schema.brainVersions.brainId,
      description: schema.brainVersions.description,
      createdBy: schema.brainVersions.createdBy,
      createdAt: schema.brainVersions.createdAt
    })

  if (!row) throw new Error('failed_to_create_snapshot')

  // Atualiza ponteiro do brain.currentVersionId
  await db
    .update(schema.brains)
    .set({ currentVersionId: row.id, updatedAt: new Date() })
    .where(eq(schema.brains.id, params.brainId))

  return {
    ...row,
    nodeCount: snapshot.nodes.length,
    edgeCount: snapshot.edges.length
  }
}

export async function restoreVersion(params: {
  versionId: string
  brainId: string
  userId: string
}): Promise<VersionSummary | null> {
  const [version] = await db
    .select()
    .from(schema.brainVersions)
    .where(
      and(
        eq(schema.brainVersions.id, params.versionId),
        eq(schema.brainVersions.brainId, params.brainId)
      )
    )
    .limit(1)

  if (!version) return null

  const snap = version.snapshot as SnapshotPayload

  // Aplica snapshot ao estado atual
  await saveBrainState({
    brainId: params.brainId,
    nodes: snap.nodes ?? [],
    edges: snap.edges ?? []
  })

  // Cria nova versão registrando o restore (não-destrutivo, mantém histórico)
  const description = version.description
    ? `Restaurado de: ${version.description}`
    : `Restaurado de versão ${new Date(version.createdAt).toLocaleString('pt-BR')}`

  return createSnapshot({
    brainId: params.brainId,
    userId: params.userId,
    description
  })
}
