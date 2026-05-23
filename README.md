# ContextOS

> **Servidor de contexto operacional plugável** (Context-as-a-Service). Qualquer IA — Claude, ChatGPT, Cursor, n8n, agentes próprios — pluga via REST API, MCP Server, OpenAPI ou Webhook e recebe contexto compilado pra cada tarefa específica.

**"Modelos são substituíveis. Contexto proprietário não é."**

---

## O que é

ContextOS resolve a fragmentação de contexto entre múltiplas IAs.

Hoje empresas e profissionais carregam os mesmos arquivos, prompts e instruções em chats diferentes, agentes diferentes, ferramentas diferentes. Cada IA tem uma cópia parcial e desatualizada do contexto. Trocar de IA = remontar tudo do zero.

ContextOS te deixa modelar **uma vez**, num canvas visual, todo o contexto que a operação precisa: persona, regras, memória institucional, documentos, conhecimento, processos. E expõe esse cérebro como **serviço plugável** que qualquer IA consome.

Quando uma IA pergunta "qual o contexto pra atender o cliente Delta?", o ContextOS:
1. Resolve escopo (workspace + projeto + cliente)
2. Filtra blocos por permissão (RBAC tag-based)
3. Rankeia relevância (embeddings + prioridade + recência)
4. Detecta conflitos
5. Comprime pro budget de tokens
6. Devolve pacote pronto pra IA usar — com trace de auditoria

📖 [PRD completo](./PRD_v0.1.md) · [Briefing original](./briefing_plataforma_inteligencia_contextual.md)

---

## Status

🚧 **Em desenvolvimento ativo.** Sprint 0 (fundação). v0.1 MVP planejado pra ~7-10 semanas.

| Sprint | Foco | Status |
|---|---|---|
| 0 | Fundação (mono-repo, docker, scaffold) | 🟡 em andamento |
| 1 | Auth + Workspace | ⚪ |
| 2 | Canvas básico (React Flow + 7 tipos de nó) | ⚪ |
| 3 | Documents + Knowledge indexing | ⚪ |
| 4 | Memory CRUD | ⚪ |
| 5 | Context Compiler (8-step pipeline) | ⚪ |
| 6 | RBAC + API Keys | ⚪ |
| 7 | MCP Server (5 tools) | ⚪ |
| 8 | Trace UI + polish | ⚪ |
| 9 | Hardening + docs | ⚪ |

---

## Stack

| Camada | Tech |
|---|---|
| Frontend + Backend | Next.js 16 (App Router + Route Handlers) |
| Canvas visual | React Flow + shadcn/ui + TailwindCSS |
| State | Zustand + TanStack Query |
| Banco | PostgreSQL 16 + pgvector |
| ORM | Drizzle |
| Cache + Queue | Redis + BullMQ |
| LLM | `@anthropic-ai/sdk` + Vercel AI SDK |
| MCP | `@modelcontextprotocol/sdk` |
| PDF | unpdf |
| Logs | Pino |
| Infra | Docker Compose + Caddy |

Detalhes: [PRD §7](./PRD_v0.1.md#7-arquitetura-técnica).

---

## Setup (dev local)

### Pré-requisitos
- Node ≥20 ([.nvmrc](./.nvmrc))
- pnpm 10+
- Docker + Docker Compose
- git

### Subir o ambiente

```bash
# 1. Clone
git clone https://github.com/IDEVA-AI/contextos.git
cd contextos

# 2. Subir infra local (Postgres + pgvector + Redis)
pnpm infra:up

# 3. Instalar dependências
pnpm install

# 4. Configurar env
cp .env.example .env.local
# Edite .env.local: ANTHROPIC_API_KEY ou OPENAI_API_KEY

# 5. Rodar migrations
pnpm db:push

# 6. Subir dev server
pnpm dev
```

Acesse: http://localhost:3000

> **Portas locais:** Postgres em `5436`, Redis em `6381` (fora do padrão pra evitar conflito com outros projetos rodando Postgres/Redis no mesmo host).

---

## Estrutura

```
contextos/
├── apps/
│   └── web/                # Next.js 16 (frontend + API + MCP)
├── packages/
│   ├── db/                 # Drizzle schema + migrations
│   ├── core/               # Context Compiler + lógica de domínio
│   ├── mcp/                # MCP server lib
│   └── worker/             # BullMQ jobs (indexação)
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   └── Caddyfile
├── docker-compose.yml      # Dev (Postgres + Redis)
├── docker-compose.prod.yml # Self-hosted full stack
├── PRD_v0.1.md             # Spec completa do produto
└── briefing_plataforma_inteligencia_contextual.md
```

---

## Diferenciais vs concorrência

| Produto | O que faz | Onde ContextOS diferencia |
|---|---|---|
| Langflow / Flowise | Canvas drag-drop de prompts/agentes | Contexto-como-primitiva, não prompt. Hierarquia + escopo + prioridade. |
| Dify | Canvas + RAG + deploy app | Contexto plugável universal, não preso ao app. |
| n8n | Automação workflow | Semântica de contexto + governança nativa. |
| mem0 / Letta | Memory APIs headless | Canvas visual + hierarquia + RBAC + MCP nativo. |

ContextOS é a primeira plataforma que combina **canvas visual + contexto-como-primitiva + hierarquia/escopo/prioridade + API plugável universal (REST + MCP + Webhook)**.

---

## License

[Apache 2.0](./LICENSE)
