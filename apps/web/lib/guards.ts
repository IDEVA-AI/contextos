import { redirect } from 'next/navigation'
import { getCurrentSession } from './session'
import { getWorkspaceByIdForUser } from './workspace'
import type { SessionPayload } from './auth'
import type { WorkspaceSummary } from './workspace'

export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  return session
}

export async function requireWorkspace(
  workspaceId: string
): Promise<{ session: SessionPayload; workspace: WorkspaceSummary }> {
  const session = await requireSession()
  const workspace = await getWorkspaceByIdForUser(workspaceId, session.userId)
  if (!workspace) redirect('/dashboard')
  return { session, workspace }
}
