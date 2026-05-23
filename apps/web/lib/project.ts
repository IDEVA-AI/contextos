import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'

export type ProjectSummary = {
  id: string
  workspaceId: string
  name: string
  description: string | null
  createdAt: Date
}

export async function listProjectsForWorkspace(
  workspaceId: string
): Promise<ProjectSummary[]> {
  return db
    .select({
      id: schema.projects.id,
      workspaceId: schema.projects.workspaceId,
      name: schema.projects.name,
      description: schema.projects.description,
      createdAt: schema.projects.createdAt
    })
    .from(schema.projects)
    .where(eq(schema.projects.workspaceId, workspaceId))
    .orderBy(asc(schema.projects.createdAt))
}

export async function getProjectByIdForUser(
  projectId: string,
  userId: string
): Promise<(ProjectSummary & { workspaceSlug: string }) | null> {
  const [row] = await db
    .select({
      id: schema.projects.id,
      workspaceId: schema.projects.workspaceId,
      workspaceSlug: schema.workspaces.slug,
      name: schema.projects.name,
      description: schema.projects.description,
      createdAt: schema.projects.createdAt
    })
    .from(schema.projects)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.projects.workspaceId))
    .where(
      and(eq(schema.projects.id, projectId), eq(schema.workspaces.ownerId, userId))
    )
    .limit(1)
  return row ?? null
}

export async function createProject(params: {
  workspaceId: string
  name: string
  description?: string
}): Promise<ProjectSummary> {
  const [row] = await db
    .insert(schema.projects)
    .values({
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description ?? null
    })
    .returning({
      id: schema.projects.id,
      workspaceId: schema.projects.workspaceId,
      name: schema.projects.name,
      description: schema.projects.description,
      createdAt: schema.projects.createdAt
    })
  if (!row) throw new Error('failed_to_create_project')
  return row
}

export async function updateProject(params: {
  projectId: string
  name?: string
  description?: string | null
}): Promise<ProjectSummary | null> {
  const patch: Record<string, unknown> = {}
  if (params.name !== undefined) patch.name = params.name
  if (params.description !== undefined) patch.description = params.description
  if (Object.keys(patch).length === 0) {
    // sem mudanças — retorna estado atual
    const [current] = await db
      .select({
        id: schema.projects.id,
        workspaceId: schema.projects.workspaceId,
        name: schema.projects.name,
        description: schema.projects.description,
        createdAt: schema.projects.createdAt
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, params.projectId))
      .limit(1)
    return current ?? null
  }
  const [row] = await db
    .update(schema.projects)
    .set(patch)
    .where(eq(schema.projects.id, params.projectId))
    .returning({
      id: schema.projects.id,
      workspaceId: schema.projects.workspaceId,
      name: schema.projects.name,
      description: schema.projects.description,
      createdAt: schema.projects.createdAt
    })
  return row ?? null
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const result = await db
    .delete(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .returning({ id: schema.projects.id })
  return result.length > 0
}
