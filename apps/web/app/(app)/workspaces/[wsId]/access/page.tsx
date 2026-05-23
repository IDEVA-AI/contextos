import { headers } from 'next/headers'
import Link from 'next/link'
import { ApiKeyCreateForm } from '@/components/api-key-create-form'
import { ApiKeyRevokeForm } from '@/components/api-key-revoke-form'
import { listAccessLogsForWorkspace } from '@/lib/access-logs'
import { listApiKeysForWorkspace } from '@/lib/api-key'
import { requireWorkspace } from '@/lib/guards'

function fmtAgo(date: Date | null): string {
  if (!date) return 'nunca'
  const ms = Date.now() - new Date(date).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `há ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

export default async function AccessPage({
  params
}: {
  params: Promise<{ wsId: string }>
}) {
  const { wsId } = await params
  const { workspace } = await requireWorkspace(wsId)
  const [keys, logs, hdrs] = await Promise.all([
    listApiKeysForWorkspace(workspace.id),
    listAccessLogsForWorkspace({ workspaceId: workspace.id, hours: 24, limit: 50 }),
    headers()
  ])

  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const host = hdrs.get('host') ?? 'localhost:3000'
  const base = `${proto}://${host}`

  const endpoints = [
    { label: 'REST API', url: `${base}/v1`, hint: '/context/compile, /memory/search...' },
    { label: 'MCP Server', url: `${base}/mcp`, hint: 'Sprint 7 — coming soon' },
    { label: 'OpenAPI', url: `${base}/openapi.json`, hint: 'Sprint 9' }
  ]

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
          <span className="text-zinc-700">acesso</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Acesso ao <span className="font-display text-zinc-500">Cérebro</span>
        </h1>
        <p className="text-sm text-zinc-600 mt-2">
          API keys, endpoints e logs de consumo. Qualquer IA com Bearer token
          pluga aqui.
        </p>
      </div>

      <section>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Endpoints
        </div>
        <div className="floating-panel p-4 space-y-2">
          {endpoints.map((e) => (
            <div key={e.label} className="flex items-center gap-3">
              <span className="text-xs font-medium w-24">{e.label}</span>
              <code className="mono text-[11px] text-zinc-700 flex-1 truncate">
                {e.url}
              </code>
              <span className="mono text-[9px] text-zinc-400 hidden md:block">
                {e.hint}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          API Keys · {keys.filter((k) => !k.revokedAt).length} ativa(s)
        </div>
        {keys.length === 0 ? (
          <div className="floating-panel p-6 text-center">
            <p className="text-xs text-zinc-500">
              Sem keys ainda. Cria a primeira abaixo.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => {
              const revoked = !!k.revokedAt
              return (
                <div
                  key={k.id}
                  className="floating-panel p-4 space-y-2"
                  style={{ opacity: revoked ? 0.5 : 1 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: revoked ? '#EF4444' : '#84BD11' }}
                      />
                      <span className="font-medium text-sm truncate">
                        {k.name}
                      </span>
                      {revoked && (
                        <span className="mono text-[10px] uppercase text-red-600">
                          revogada
                        </span>
                      )}
                    </div>
                    {!revoked && (
                      <ApiKeyRevokeForm
                        keyId={k.id}
                        workspaceId={workspace.id}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="mono text-[10px] text-zinc-500">
                      {k.keyPrefix}...
                    </code>
                    <span className="text-zinc-300">·</span>
                    {k.scopes.length === 0 ? (
                      <span className="mono text-[10px] text-zinc-400">
                        sem scopes
                      </span>
                    ) : (
                      k.scopes.map((s) => (
                        <span
                          key={s}
                          className="mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mono text-[10px] text-zinc-500 flex items-center gap-3">
                    <span>criada {fmtAgo(k.createdAt)}</span>
                    <span className="text-zinc-300">·</span>
                    <span>última uso {fmtAgo(k.lastUsedAt)}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{k.totalRequests} chamadas</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <ApiKeyCreateForm workspaceId={workspace.id} />
      </section>

      <section>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Logs · últimas 24h · {logs.length} consultas
        </div>
        {logs.length === 0 ? (
          <div className="floating-panel p-6 text-center">
            <p className="text-xs text-zinc-500">Sem chamadas nas últimas 24h.</p>
          </div>
        ) : (
          <div className="floating-panel overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white border-b border-zinc-100">
                  <tr className="mono text-[10px] uppercase tracking-wider text-zinc-400 text-left">
                    <th className="px-3 py-2">Quando</th>
                    <th className="px-3 py-2">Key</th>
                    <th className="px-3 py-2">Endpoint</th>
                    <th className="px-3 py-2 text-right">Status</th>
                    <th className="px-3 py-2 text-right">Blocos</th>
                    <th className="px-3 py-2 text-right">Tokens</th>
                    <th className="px-3 py-2 text-right">Tempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-1.5 mono text-[10px] text-zinc-500">
                        {new Date(l.createdAt).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="px-3 py-1.5 truncate max-w-32">
                        {l.apiKeyName ?? (
                          <span className="text-zinc-400 italic">session</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 mono text-[10px]">
                        {l.endpoint}
                      </td>
                      <td
                        className="px-3 py-1.5 mono text-[10px] text-right"
                        style={{
                          color: l.statusCode >= 400 ? '#EF4444' : '#84BD11'
                        }}
                      >
                        {l.statusCode}
                      </td>
                      <td className="px-3 py-1.5 mono text-[10px] text-right">
                        {l.blocksIncluded}
                      </td>
                      <td className="px-3 py-1.5 mono text-[10px] text-right">
                        {l.tokensEstimated.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-1.5 mono text-[10px] text-right">
                        {l.durationMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
