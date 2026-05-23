import { redirect } from 'next/navigation'
import { requireSession } from './guards'
import { getProjectByIdForUser, type ProjectSummary } from './project'
import type { SessionPayload } from './auth'

export async function requireProject(projectId: string): Promise<{
  session: SessionPayload
  project: ProjectSummary & { workspaceSlug: string }
}> {
  const session = await requireSession()
  const project = await getProjectByIdForUser(projectId, session.userId)
  if (!project) redirect('/dashboard')
  return { session, project }
}
