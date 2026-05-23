import Link from 'next/link'
import { WorkspaceCreateForm } from '@/components/workspace-create-form'
import { requireSession } from '@/lib/guards'
import { listWorkspacesForUser } from '@/lib/workspace'

export default async function DashboardPage() {
  const session = await requireSession()
  const workspaces = await listWorkspacesForUser(session.userId)

  return (
    <div className="space-y-8">
      <div>
        <div className="mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Dashboard
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Seus <span className="font-display text-zinc-500">workspaces</span>
        </h1>
        <p className="text-sm text-zinc-600 mt-2">
          Workspace é o nível mais alto: contém projetos e cérebros.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <div className="floating-panel p-8 text-center">
          <p className="text-sm text-zinc-600 mb-1">Nenhum workspace ainda.</p>
          <p className="text-xs text-zinc-500">Crie o primeiro abaixo.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="floating-panel p-4 hover:bg-zinc-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: '#C5F432' }}
                />
                <span className="mono text-[10px] uppercase tracking-wider text-zinc-400">
                  workspace
                </span>
              </div>
              <div className="font-medium text-sm truncate">{ws.name}</div>
              <div className="mono text-[10px] text-zinc-400 mt-1 truncate">
                /{ws.slug}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="max-w-md">
        <WorkspaceCreateForm />
      </div>
    </div>
  )
}
