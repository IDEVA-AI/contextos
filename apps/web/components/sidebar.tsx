import Link from 'next/link'
import { listWorkspacesForUser } from '@/lib/workspace'
import { UserMenu } from './user-menu'

export async function Sidebar({
  userId,
  email,
  activeWorkspaceId
}: {
  userId: string
  email: string
  activeWorkspaceId?: string
}) {
  const workspaces = await listWorkspacesForUser(userId)

  return (
    <aside className="floating-panel sticky top-4 ml-4 mt-4 mb-4 h-[calc(100vh-2rem)] w-60 flex flex-col">
      <div className="px-4 py-4 border-b border-zinc-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md"
            style={{ background: '#C5F432' }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-zinc-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <title>ContextOS</title>
              <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
            </svg>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="brand-mark text-sm">CONTEXTOS</span>
            <span className="mono text-[9px] text-zinc-400">v0.1.0-alpha</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 px-2 mb-2">
          Workspaces
        </div>
        <nav className="space-y-0.5">
          {workspaces.length === 0 && (
            <p className="text-xs text-zinc-500 px-2 py-3 leading-relaxed">
              Nenhum workspace ainda. Crie o primeiro pra começar.
            </p>
          )}
          {workspaces.map((ws) => {
            const active = ws.id === activeWorkspaceId
            return (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className={
                  active
                    ? 'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-900'
                    : 'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: active ? '#C5F432' : '#A1A1AA' }}
                />
                <span className="truncate">{ws.name}</span>
              </Link>
            )
          })}
        </nav>
        <Link
          href="/dashboard"
          className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <title>Novo</title>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo workspace
        </Link>
      </div>

      <UserMenu email={email} />
    </aside>
  )
}
