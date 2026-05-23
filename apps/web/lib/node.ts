import { and, eq, inArray } from 'drizzle-orm'
import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'
import { db, schema } from '@contextos/db'
import type { Edge as DbEdge, NewNode, Node as DbNode } from '@contextos/db'

export type CanvasNodeData = {
  title: string
  content: string | null
  priority: number
  scope: DbNode['scope']
  tags: string[]
  mode: 'single' | 'multi'
  enabled: boolean
  metadata: Record<string, unknown>
}

export type CanvasNode = RFNode<CanvasNodeData>
export type CanvasEdge = RFEdge

export async function listNodesForBrain(brainId: string): Promise<CanvasNode[]> {
  const rows = await db
    .select()
    .from(schema.nodes)
    .where(eq(schema.nodes.brainId, brainId))
  return rows.map(rowToCanvasNode)
}

export async function listEdgesForBrain(brainId: string): Promise<CanvasEdge[]> {
  const rows = await db
    .select()
    .from(schema.edges)
    .where(eq(schema.edges.brainId, brainId))
  return rows.map(rowToCanvasEdge)
}

function rowToCanvasNode(row: DbNode): CanvasNode {
  return {
    id: row.id,
    type: row.type,
    position: { x: row.positionX, y: row.positionY },
    data: {
      title: row.title,
      content: row.content,
      priority: row.priority,
      scope: row.scope,
      tags: row.tags,
      mode: row.mode,
      enabled: row.enabled,
      metadata: (row.metadata ?? {}) as Record<string, unknown>
    }
  }
}

function rowToCanvasEdge(row: DbEdge): CanvasEdge {
  return {
    id: row.id,
    source: row.sourceNodeId,
    target: row.targetNodeId,
    label: row.label ?? undefined
  }
}

// --- Persistence ---

export type NodePayload = {
  id: string
  type: DbNode['type']
  title: string
  content: string | null
  priority: number
  scope: DbNode['scope']
  tags: string[]
  mode: 'single' | 'multi'
  enabled: boolean
  positionX: number
  positionY: number
  metadata: Record<string, unknown>
}

export type EdgePayload = {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label: string | null
}

export async function saveBrainState(params: {
  brainId: string
  nodes: NodePayload[]
  edges: EdgePayload[]
}): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Delete edges that no longer exist
    const incomingEdgeIds = params.edges.map((e) => e.id)
    if (incomingEdgeIds.length === 0) {
      await tx.delete(schema.edges).where(eq(schema.edges.brainId, params.brainId))
    } else {
      const stale = await tx
        .select({ id: schema.edges.id })
        .from(schema.edges)
        .where(eq(schema.edges.brainId, params.brainId))
      const toDelete = stale.map((s) => s.id).filter((id) => !incomingEdgeIds.includes(id))
      if (toDelete.length > 0) {
        await tx.delete(schema.edges).where(inArray(schema.edges.id, toDelete))
      }
    }

    // 2. Delete nodes that no longer exist
    const incomingNodeIds = params.nodes.map((n) => n.id)
    if (incomingNodeIds.length === 0) {
      await tx.delete(schema.nodes).where(eq(schema.nodes.brainId, params.brainId))
    } else {
      const stale = await tx
        .select({ id: schema.nodes.id })
        .from(schema.nodes)
        .where(eq(schema.nodes.brainId, params.brainId))
      const toDelete = stale.map((s) => s.id).filter((id) => !incomingNodeIds.includes(id))
      if (toDelete.length > 0) {
        await tx.delete(schema.nodes).where(inArray(schema.nodes.id, toDelete))
      }
    }

    // 3. Upsert nodes
    for (const node of params.nodes) {
      const values: NewNode = {
        id: node.id,
        brainId: params.brainId,
        type: node.type,
        title: node.title,
        content: node.content,
        priority: node.priority,
        scope: node.scope,
        tags: node.tags,
        mode: node.mode,
        enabled: node.enabled,
        positionX: node.positionX,
        positionY: node.positionY,
        metadata: node.metadata,
        updatedAt: new Date()
      }
      await tx
        .insert(schema.nodes)
        .values(values)
        .onConflictDoUpdate({
          target: schema.nodes.id,
          set: {
            type: values.type,
            title: values.title,
            content: values.content,
            priority: values.priority,
            scope: values.scope,
            tags: values.tags,
            mode: values.mode,
            enabled: values.enabled,
            positionX: values.positionX,
            positionY: values.positionY,
            metadata: values.metadata,
            updatedAt: values.updatedAt
          }
        })
    }

    // 4. Upsert edges
    for (const edge of params.edges) {
      await tx
        .insert(schema.edges)
        .values({
          id: edge.id,
          brainId: params.brainId,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          label: edge.label
        })
        .onConflictDoUpdate({
          target: schema.edges.id,
          set: {
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            label: edge.label
          }
        })
    }

    // 5. Touch brain.updatedAt
    await tx
      .update(schema.brains)
      .set({ updatedAt: new Date() })
      .where(eq(schema.brains.id, params.brainId))
  })
}
