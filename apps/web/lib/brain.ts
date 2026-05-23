import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'

export type BrainSummary = {
  id: string
  projectId: string
  name: string
  description: string | null
  currentVersionId: string | null
  createdAt: Date
  updatedAt: Date
}

export async function listBrainsForProject(projectId: string): Promise<BrainSummary[]> {
  return db
    .select({
      id: schema.brains.id,
      projectId: schema.brains.projectId,
      name: schema.brains.name,
      description: schema.brains.description,
      currentVersionId: schema.brains.currentVersionId,
      createdAt: schema.brains.createdAt,
      updatedAt: schema.brains.updatedAt
    })
    .from(schema.brains)
    .where(eq(schema.brains.projectId, projectId))
    .orderBy(asc(schema.brains.createdAt))
}

export type BrainWithProject = BrainSummary & {
  projectName: string
  workspaceId: string
}

export async function listBrainsForWorkspace(
  workspaceId: string
): Promise<BrainWithProject[]> {
  return db
    .select({
      id: schema.brains.id,
      projectId: schema.brains.projectId,
      name: schema.brains.name,
      description: schema.brains.description,
      currentVersionId: schema.brains.currentVersionId,
      createdAt: schema.brains.createdAt,
      updatedAt: schema.brains.updatedAt,
      projectName: schema.projects.name,
      workspaceId: schema.projects.workspaceId
    })
    .from(schema.brains)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.brains.projectId))
    .where(eq(schema.projects.workspaceId, workspaceId))
    .orderBy(asc(schema.brains.createdAt))
}

export async function getBrainByIdForUser(
  brainId: string,
  userId: string
): Promise<
  | (BrainSummary & {
      workspaceId: string
      workspaceSlug: string
      workspaceName: string
      projectName: string
    })
  | null
> {
  const [row] = await db
    .select({
      id: schema.brains.id,
      projectId: schema.brains.projectId,
      name: schema.brains.name,
      description: schema.brains.description,
      currentVersionId: schema.brains.currentVersionId,
      createdAt: schema.brains.createdAt,
      updatedAt: schema.brains.updatedAt,
      workspaceId: schema.workspaces.id,
      workspaceSlug: schema.workspaces.slug,
      workspaceName: schema.workspaces.name,
      projectName: schema.projects.name
    })
    .from(schema.brains)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.brains.projectId))
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.projects.workspaceId))
    .where(and(eq(schema.brains.id, brainId), eq(schema.workspaces.ownerId, userId)))
    .limit(1)
  return row ?? null
}

export async function createBrain(params: {
  projectId: string
  name: string
  description?: string
}): Promise<BrainSummary> {
  const [row] = await db
    .insert(schema.brains)
    .values({
      projectId: params.projectId,
      name: params.name,
      description: params.description ?? null
    })
    .returning({
      id: schema.brains.id,
      projectId: schema.brains.projectId,
      name: schema.brains.name,
      description: schema.brains.description,
      currentVersionId: schema.brains.currentVersionId,
      createdAt: schema.brains.createdAt,
      updatedAt: schema.brains.updatedAt
    })
  if (!row) throw new Error('failed_to_create_brain')
  return row
}

export async function updateBrain(params: {
  brainId: string
  name?: string
  description?: string | null
}): Promise<BrainSummary | null> {
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (params.name !== undefined) patch.name = params.name
  if (params.description !== undefined) patch.description = params.description
  const [row] = await db
    .update(schema.brains)
    .set(patch)
    .where(eq(schema.brains.id, params.brainId))
    .returning({
      id: schema.brains.id,
      projectId: schema.brains.projectId,
      name: schema.brains.name,
      description: schema.brains.description,
      currentVersionId: schema.brains.currentVersionId,
      createdAt: schema.brains.createdAt,
      updatedAt: schema.brains.updatedAt
    })
  return row ?? null
}

export async function deleteBrain(brainId: string): Promise<boolean> {
  const result = await db
    .delete(schema.brains)
    .where(eq(schema.brains.id, brainId))
    .returning({ id: schema.brains.id })
  return result.length > 0
}
