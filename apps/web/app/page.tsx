export default function Home() {
  return (
    <div className="canvas-paper relative min-h-screen flex flex-col">
      <div className="grain" />

      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-zinc-200/70">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2">
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
            <span className="brand-mark text-base">CONTEXTOS</span>
            <span className="mono text-[10px] text-zinc-400 ml-1">· v0.1.0-alpha</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-xs ml-auto text-zinc-600">
            <span>Sprint 0 · fundação</span>
          </nav>
        </div>
      </header>

      <main className="relative flex-1 max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
          Context-as-a-Service · em desenvolvimento
        </div>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-3">
          ContextOS, <span className="font-display text-zinc-500">no detalhe</span>
        </h1>
        <p className="text-zinc-600 max-w-2xl leading-relaxed text-base">
          Servidor de contexto operacional plugável. Você modela contexto (memória, regras,
          conhecimento, persona) UMA vez. Qualquer IA — Claude, ChatGPT, Cursor, n8n, agentes
          próprios — pluga via REST API, MCP Server, Webhook ou SDK e recebe pacote de contexto
          compilado pra cada tarefa.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/IDEVA-AI/contextos"
            className="btn-brand hover:bg-brand-200 active:bg-brand-400"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <title>GitHub</title>
              <path d="M12 0a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 0Z" />
            </svg>
            github.com/IDEVA-AI/contextos
          </a>
          <span className="floating-panel inline-flex items-center gap-2 px-3 py-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: '#84BD11',
                boxShadow: '0 0 0 2px white, 0 0 0 4px rgba(197,244,50,.45)'
              }}
            />
            postgres + redis up · schema aplicado (12 tabelas)
          </span>
        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SprintCard num="0" title="Fundação" status="active">
            mono-repo, Next.js 16, Drizzle schema, Docker compose, LICENSE
          </SprintCard>
          <SprintCard num="1" title="Auth + Workspace" status="planned">
            signup/login/dashboard, CRUD workspaces e projetos
          </SprintCard>
          <SprintCard num="2" title="Canvas" status="planned">
            React Flow + 7 tipos de nó, painel de propriedades, auto-save
          </SprintCard>
          <SprintCard num="3" title="Documents + Knowledge" status="planned">
            upload PDF, chunking, embeddings, pgvector
          </SprintCard>
          <SprintCard num="4" title="Memory" status="planned">
            CRUD + busca semântica
          </SprintCard>
          <SprintCard num="5" title="Context Compiler" status="planned">
            pipeline 8 passos, cache, trace
          </SprintCard>
          <SprintCard num="6" title="RBAC + API Keys" status="planned">
            tag-based, default-deny, wildcards
          </SprintCard>
          <SprintCard num="7" title="MCP Server" status="planned">
            5 tools, Claude Desktop ready
          </SprintCard>
          <SprintCard num="8" title="Trace UI + polish" status="planned">
            logs, export CSV, botão Testar
          </SprintCard>
        </div>

        <div className="mt-12 mono text-[11px] text-zinc-500">
          snap 16px · easing cubic-bezier(.16,1,.3,1) · um verde · floating-first
        </div>
      </main>

      <footer className="relative border-t border-zinc-200/70 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <div>
            <span className="mono">Apache 2.0</span> · self-hosted · open-core
          </div>
          <div className="mono">
            stack · Next.js 16 · Drizzle · pgvector · BullMQ · @xyflow/react · MCP
          </div>
        </div>
      </footer>
    </div>
  )
}

function SprintCard({
  num,
  title,
  status,
  children
}: {
  num: string
  title: string
  status: 'active' | 'planned' | 'production' | 'paused'
  children: React.ReactNode
}) {
  const statusColor = {
    active: '#C5F432',
    planned: '#A1A1AA',
    production: '#F59E0B',
    paused: '#EF4444'
  }[status]

  return (
    <div className="floating-panel p-4 relative">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: statusColor,
            boxShadow: status === 'active' ? '0 0 0 2px white' : undefined,
            animation: status === 'active' ? 'pulse-brand 1.4s ease-out infinite' : undefined
          }}
        />
        <span className="mono text-[10px] uppercase tracking-wider text-zinc-400">
          sprint {num}
        </span>
      </div>
      <div className="font-medium mb-1 text-sm">{title}</div>
      <p className="text-xs text-zinc-600 leading-relaxed">{children}</p>
    </div>
  )
}
