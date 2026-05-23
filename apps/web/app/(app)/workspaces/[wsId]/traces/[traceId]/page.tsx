import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireWorkspace } from '@/lib/guards'
import { getTraceForUser } from '@/lib/trace-detail'

export default async function TraceDetailPage({
  params
}: {
  params: Promise<{ wsId: string; traceId: string }>
}) {
  const { wsId, traceId } = await params
  const { session, workspace } = await requireWorkspace(wsId)
  const trace = await getTraceForUser({ traceId, userId: session.userId })
  if (!trace || trace.workspaceId !== workspace.id) notFound()

  const statusColor = trace.statusCode >= 400 ? '#EF4444' : '#84BD11'

  return (
    <div className="space-y-6">
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
          <Link
            href={`/workspaces/${workspace.id}/access`}
            className="hover:text-zinc-900"
          >
            acesso
          </Link>
          <span>/</span>
          <span className="text-zinc-700 mono">trace {trace.id.slice(0, 8)}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Trace · {trace.endpoint}
        </h1>
        <p className="mono text-[11px] text-zinc-500 mt-1">{trace.id}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Quando" value={new Date(trace.createdAt).toLocaleString('pt-BR')} />
        <Stat
          label="Status"
          value={trace.statusCode.toString()}
          color={statusColor}
        />
        <Stat label="Duração" value={`${trace.durationMs}ms`} />
        <Stat
          label="API Key"
          value={trace.apiKeyName ?? 'session'}
          mono
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Considerados" value={trace.blocksConsidered.toString()} />
        <Stat label="Incluídos" value={trace.blocksIncluded.toString()} />
        <Stat label="Excluídos" value={trace.blocksExcluded.toString()} />
        <Stat
          label="Tokens estimados"
          value={trace.tokensEstimated.toLocaleString('pt-BR')}
        />
      </div>

      {trace.warnings.length > 0 && (
        <section>
          <div className="mono text-[10px] uppercase tracking-wider text-amber-600 mb-2">
            Warnings · {trace.warnings.length}
          </div>
          <div className="space-y-1">
            {trace.warnings.map((w, i) => (
              <div
                key={i}
                className="floating-panel p-3 text-xs bg-amber-50/50 border-amber-100"
              >
                {w}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
          Request payload
        </div>
        <pre className="floating-panel p-4 mono text-[11px] leading-relaxed whitespace-pre-wrap break-words bg-zinc-50/50 max-h-96 overflow-y-auto">
          {JSON.stringify(trace.requestPayload, null, 2)}
        </pre>
      </section>

      {trace.brainId && (
        <section>
          <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
            Cérebro
          </div>
          <Link
            href={`/brains/${trace.brainId}`}
            className="floating-panel inline-flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-50"
          >
            <span className="mono text-[10px] text-zinc-400">id</span>
            {trace.brainId.slice(0, 8)}...
            {trace.brainVersionId && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="mono text-[10px] text-zinc-500">
                  v {trace.brainVersionId.slice(0, 6)}
                </span>
              </>
            )}
          </Link>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  mono
}: {
  label: string
  value: string
  color?: string
  mono?: boolean
}) {
  return (
    <div className="floating-panel p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
        {label}
      </div>
      <div
        className={mono ? 'mono text-xs' : 'text-sm font-medium'}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  )
}
