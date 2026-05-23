import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@contextos/db'
import { randomSuffix, slugify } from './slug'

export type WorkspaceSummary = {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  return db
    .select({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      createdAt: schema.workspaces.createdAt
    })
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerId, userId))
    .orderBy(asc(schema.workspaces.createdAt))
}

export async function getWorkspaceByIdForUser(
  workspaceId: string,
  userId: string
): Promise<WorkspaceSummary | null> {
  const [row] = await db
    .select({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      createdAt: schema.workspaces.createdAt
    })
    .from(schema.workspaces)
    .where(
      and(eq(schema.workspaces.id, workspaceId), eq(schema.workspaces.ownerId, userId))
    )
    .limit(1)
  return row ?? null
}

async function generateUniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'workspace'
  let attempt = root
  for (let i = 0; i < 5; i++) {
    const existing = await db
      .select({ id: schema.workspaces.id })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, attempt))
      .limit(1)
    if (existing.length === 0) return attempt
    attempt = `${root}-${randomSuffix()}`
  }
  // Improvável: timestamp como ultimo recurso
  return `${root}-${Date.now().toString(36)}`
}

export async function createWorkspace(params: {
  ownerId: string
  name: string
}): Promise<WorkspaceSummary> {
  const slug = await generateUniqueSlug(params.name)
  const [row] = await db
    .insert(schema.workspaces)
    .values({ ownerId: params.ownerId, name: params.name, slug })
    .returning({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      createdAt: schema.workspaces.createdAt
    })
  if (!row) throw new Error('failed_to_create_workspace')
  return row
}

export async function renameWorkspace(params: {
  workspaceId: string
  ownerId: string
  name: string
}): Promise<WorkspaceSummary | null> {
  const [row] = await db
    .update(schema.workspaces)
    .set({ name: params.name })
    .where(
      and(
        eq(schema.workspaces.id, params.workspaceId),
        eq(schema.workspaces.ownerId, params.ownerId)
      )
    )
    .returning({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      createdAt: schema.workspaces.createdAt
    })
  return row ?? null
}

export async function deleteWorkspace(params: {
  workspaceId: string
  ownerId: string
}): Promise<boolean> {
  const result = await db
    .delete(schema.workspaces)
    .where(
      and(
        eq(schema.workspaces.id, params.workspaceId),
        eq(schema.workspaces.ownerId, params.ownerId)
      )
    )
    .returning({ id: schema.workspaces.id })
  return result.length > 0
}
