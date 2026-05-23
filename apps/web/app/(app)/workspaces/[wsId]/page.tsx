import Link from 'next/link'
import { BrainCreateForm } from '@/components/brain-create-form'
import { BrainDeleteForm } from '@/components/brain-delete-form'
import { BrainFromTemplateForm } from '@/components/brain-from-template-form'
import { ProjectCreateForm } from '@/components/project-create-form'
import { ProjectDeleteForm } from '@/components/project-delete-form'
import { listBrainsForProject } from '@/lib/brain'
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
  const brainsPerProject = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      brains: await listBrainsForProject(p.id)
    }))
  )

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
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/workspaces/${workspace.id}/memories`}
            className="floating-panel inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition-colors"
          >
            <span className="mono text-[10px] text-zinc-400">m</span>
            Memórias
          </Link>
          <Link
            href={`/workspaces/${workspace.id}/access`}
            className="floating-panel inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition-colors"
          >
            <span className="mono text-[10px] text-zinc-400">a</span>
            Acesso ao cérebro
          </Link>
        </div>
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
          <div className="space-y-3">
            {brainsPerProject.map(({ project: proj, brains }) => (
              <div key={proj.id} className="floating-panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
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

                <div className="border-t border-zinc-100 pt-3 space-y-2">
                  <div className="mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Cérebros · {brains.length}
                  </div>
                  {brains.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">
                      Sem cérebros nesse projeto ainda.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {brains.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-zinc-50"
                        >
                          <Link
                            href={`/brains/${b.id}`}
                            className="flex items-center gap-2 min-w-0 flex-1"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: '#C5F432' }}
                            />
                            <span className="text-xs truncate">{b.name}</span>
                          </Link>
                          <BrainDeleteForm brainId={b.id} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <BrainCreateForm projectId={proj.id} />
                  <BrainFromTemplateForm projectId={proj.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
