import Link from 'next/link'
import { ProjectCreateForm } from '@/components/project-create-form'
import { ProjectDeleteForm } from '@/components/project-delete-form'
import { requireWorkspace } from '@/lib/guards'
import { listProjectsForWorkspace } from '@/lib/project'

export default async function WorkspaceDetailPage({
  params
}: {
  params: Promise<{ wsId: string }>
}) {
  const { wsId } = await params
  const { workspace } = await requireWorkspace(wsId)
  const projects = await listProjectsForWorkspace(workspace.id)

  return (
    <div className="space-y-8">
      <div>
        <div className="mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-zinc-900">
            workspaces
          </Link>
          <span>/</span>
          <span className="text-zinc-700">{workspace.slug}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{workspace.name}</h1>
        <p className="text-sm text-zinc-600 mt-2">
          Projetos agrupam cérebros relacionados. Cada cérebro vira um canvas executável.
        </p>
      </div>

      <ProjectCreateForm workspaceId={workspace.id} />

      <div>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Projetos · {projects.length}
        </div>
        {projects.length === 0 ? (
          <div className="floating-panel p-6 text-center">
            <p className="text-xs text-zinc-500">
              Sem projetos ainda. Cria o primeiro acima.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="floating-panel p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{proj.name}</div>
                  {proj.description && (
                    <div className="text-xs text-zinc-500 mt-0.5 truncate">
                      {proj.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="mono text-[10px] text-zinc-400">
                    {new Date(proj.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <ProjectDeleteForm projectId={proj.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
