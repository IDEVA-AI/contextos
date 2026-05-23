# ContextOS

> **Servidor de contexto operacional plugável** (Context-as-a-Service). Qualquer IA — Claude, ChatGPT, Cursor, n8n, agentes próprios — pluga via REST API, MCP Server, OpenAPI ou Webhook e recebe contexto compilado pra cada tarefa específica.

**"Modelos são substituíveis. Contexto proprietário não é."**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![MVP](https://img.shields.io/badge/MVP-v0.1.0-C5F432.svg)](#status)
[![Self-hosted](https://img.shields.io/badge/self--hosted-docker--compose-zinc.svg)](./docs/self-hosting.md)

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

📖 [PRD completo](./PRD_v0.1.md) · [Architecture](./docs/architecture.md) · [API Reference](./docs/api-reference.md) · [MCP Guide](./docs/mcp-guide.md) · [Self-hosting](./docs/self-hosting.md)

---

## Status — **MVP v0.1.0 completo** ✓

| Sprint | Entrega | Status |
|---|---|---|
| 0 | Fundação (mono-repo, Docker, scaffold) | ✅ |
| 1 | Auth + Workspaces + Projetos | ✅ |
| 2 | Canvas builder (React Flow + 7 tipos de nó + auto-save + versions) | ✅ |
| 3 | Documents + Worker (PDF/MD/TXT → chunks + embeddings) | ✅ |
| 4 | Memory CRUD + busca semântica pgvector | ✅ |
| 5 | Context Compiler (8-step pipeline + cache + 4 formatos) | ✅ |
| 6 | API Keys + Bearer auth + RBAC tag-based | ✅ |
| 7 | **MCP Server** — Claude Desktop / Cursor / Cline plugam | ✅ |
| 8 | Trace UI + filtros + CSV + botão "Testar com IA" + templates | ✅ |
| 9 | Rate limit + health + backup + CI + docs completas | ✅ |

**Repo público**: https://github.com/IDEVA-AI/contextos

---

## Stack

| Camada | Tech |
|---|---|
| Frontend + Backend | Next.js 16 (App Router + Route Handlers) |
| Canvas | `@xyflow/react` 12 |
| UI | shadcn-style + TailwindCSS 4 |
| State | Zustand + TanStack Query |
| Banco | PostgreSQL 16 + pgvector (HNSW) |
| ORM | Drizzle 0.45 |
| Cache + Queue | Redis 7 + BullMQ 5 |
| LLM | `@anthropic-ai/sdk` 0.98 + `openai` 6.39 |
| MCP | `@modelcontextprotocol/sdk` 1.29 |
| PDF | unpdf 1.6 |
| Auth | bcrypt + jose (JWT) |
| Logs | Pino |
| Infra | Docker Compose + Caddy |

Detalhes: [architecture.md](./docs/architecture.md).

---

## Setup (dev local)

```bash
git clone https://github.com/IDEVA-AI/contextos.git
cd contextos
pnpm infra:up                            # Postgres+pgvector + Redis
pnpm install
cp .env.example .env.local
ln -sf ../../.env.local apps/web/.env.local
pnpm db:push                             # cria 12 tabelas
pnpm dev                                 # http://localhost:3000

# em outro terminal:
pnpm --filter @contextos/worker dev      # processa indexação
```

Detalhes em [docs/self-hosting.md](./docs/self-hosting.md).

> **Portas locais**: Postgres em `5436`, Redis em `6381` (fora do padrão pra evitar conflito).

---

## Setup (self-hosted produção)

```bash
cp .env.example .env
# define PUBLIC_URL, POSTGRES_PASSWORD, NEXTAUTH_SECRET
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec web pnpm db:push
```

Caddy serve HTTPS automático no `PUBLIC_URL`. Backup automático via `docker/backup-postgres.sh` + cron.

---

## Plugar Claude Desktop em 4 passos

1. Cria API key em `/workspaces/[id]/access`
2. Edita `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "contextos": {
         "transport": {
           "type": "streamable-http",
           "url": "http://localhost:3000/mcp",
           "headers": { "Authorization": "Bearer ctx_sk_live_xxx" }
         }
       }
     }
   }
   ```
3. Restart Claude Desktop
4. No chat: "liste os cérebros disponíveis"

Detalhes: [docs/mcp-guide.md](./docs/mcp-guide.md).

---

## Terminal client (`@contextos/cli`)

```bash
pnpm --filter @contextos/cli build
node packages/cli/dist/index.js auth login   # interactive
node packages/cli/dist/index.js brains list -w <workspace_id>
node packages/cli/dist/index.js compile <brainId> -w <ws> -q "proposta"
node packages/cli/dist/index.js docs upload <brainId> ./manual.pdf
```

Detalhes: [docs/cli-guide.md](./docs/cli-guide.md).

---

## Estrutura

```
contextos/
├── apps/web/                # Next.js 16 (frontend + API + MCP server)
├── packages/
│   ├── db/                  # Drizzle schema + migrations (12 tabelas)
│   ├── core/                # Storage, chunking, extractors, embeddings
│   ├── mcp/                 # placeholder pra futura extração
│   ├── cli/                 # @contextos/cli — terminal client (bin: contextos)
│   └── worker/              # BullMQ jobs (indexação de docs)
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   ├── Caddyfile
│   └── backup-postgres.sh
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── self-hosting.md
│   ├── mcp-guide.md
│   ├── cli-guide.md
│   └── getting-started.md
├── docker-compose.yml       # Dev local (Postgres + Redis)
├── docker-compose.prod.yml  # Self-hosted full stack
└── PRD_v0.1.md              # Spec completa do produto
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

## Próximas evoluções (pós-MVP)

- Sumarização LLM no Compiler
- Conflict-judge LLM (detecção semântica)
- Agentes executáveis (Tool, Router, Validator nodes)
- Integrações específicas (Drive, Notion, n8n) via conectores
- OpenAPI Actions (Custom GPT)
- SDK oficial TS/Python
- Diff visual de versões
- Multi-tenant + SSO/SAML
- Cloud hospedado (oferta managed)

---

## License

[Apache 2.0](./LICENSE)
