import Link from 'next/link'
import { MemoryCreateForm } from '@/components/memory-create-form'
import { MemoryDeleteForm } from '@/components/memory-delete-form'
import { requireWorkspace } from '@/lib/guards'
import { listMemoriesForWorkspace } from '@/lib/memory'
import { listProjectsForWorkspace } from '@/lib/project'

export default async function MemoriesPage({
  params
}: {
  params: Promise<{ wsId: string }>
}) {
  const { wsId } = await params
  const { workspace } = await requireWorkspace(wsId)
  const [memories, projects] = await Promise.all([
    listMemoriesForWorkspace(workspace.id),
    listProjectsForWorkspace(workspace.id)
  ])

  const scopes = [
    { type: 'workspace' as const, id: workspace.id, label: workspace.name },
    ...projects.map((p) => ({
      type: 'projeto' as const,
      id: p.id,
      label: p.name
    }))
  ]

  const projectNameById = new Map(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-8">
      <div>
        <div className="mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-zinc-900">
            workspaces
          </Link>
          <span>/</span>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="hover:text-zinc-900"
          >
            {workspace.slug}
          </Link>
          <span>/</span>
          <span className="text-zinc-700">memórias</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="font-display text-zinc-500">Memórias</span> do cérebro
        </h1>
        <p className="text-sm text-zinc-600 mt-2">
          Decisões, aprendizados, objeções, padrões. Cada IA consulta via{' '}
          <span className="mono text-xs bg-zinc-100 px-1 rounded">
            /v1/memory/search
          </span>{' '}
          e recebe as mais relevantes pra tarefa.
        </p>
      </div>

      <MemoryCreateForm
        workspaceId={workspace.id}
        scopes={scopes}
        defaultScopeId={workspace.id}
      />

      <div>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Memórias salvas · {memories.length}
        </div>
        {memories.length === 0 ? (
          <div className="floating-panel p-6 text-center">
            <p className="text-xs text-zinc-500">
              Sem memórias ainda. Cria a primeira acima.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((m) => {
              const scopeLabel =
                m.scopeType === 'workspace'
                  ? workspace.name
                  : projectNameById.get(m.scopeId) ?? 'projeto'
              return (
                <div key={m.id} className="floating-panel p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-[10px] uppercase tracking-wider text-zinc-400">
                          {m.scopeType}
                        </span>
                        <span className="text-zinc-300">·</span>
                        <span className="mono text-[10px] text-zinc-500">
                          {scopeLabel}
                        </span>
                        {m.hasEmbedding && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <span
                              className="mono text-[10px]"
                              style={{ color: '#84BD11' }}
                              title="Embedding gerado — busca semântica ativa"
                            >
                              indexada
                            </span>
                          </>
                        )}
                      </div>
                      {m.title && (
                        <div className="font-medium text-sm">{m.title}</div>
                      )}
                      <div className="text-xs text-zinc-700 mt-0.5 leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="mono text-[10px] text-zinc-400">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <MemoryDeleteForm
                        memoryId={m.id}
                        workspaceId={workspace.id}
                      />
                    </div>
                  </div>
                  {m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((tag) => (
                        <span
                          key={tag}
                          className="mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
