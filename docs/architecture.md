# Arquitetura

ContextOS é uma plataforma de **Context-as-a-Service**: organiza contexto (memória, regras, conhecimento, persona) em cérebros visuais e expõe via REST/MCP pra qualquer IA consumir.

## 4 camadas

```
┌────────────────────────────────────────────────────────────┐
│ HUMAN LAYER — Next.js 16 (App Router, RSC)                 │
│ Dashboard · Canvas Builder · Memórias · Acesso ao Cérebro  │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ BRAIN LAYER — lib/* + packages/core                        │
│ ContextGraph · MemoryStore · KnowledgeIndex · Compiler     │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ ACCESS LAYER — Next.js Route Handlers + MCP                │
│ REST /v1/* · MCP /mcp · Webhooks (futuro) · OpenAPI        │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ AI LAYER — consumidores externos                           │
│ Claude Desktop · Cursor · ChatGPT · n8n · agentes próprios │
└────────────────────────────────────────────────────────────┘
```

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) |
| Canvas | `@xyflow/react` 12 |
| UI | shadcn-style + TailwindCSS 4 |
| Banco | PostgreSQL 16 + pgvector |
| ORM | Drizzle 0.45 |
| Cache + Queue | Redis 7 + BullMQ 5 |
| MCP | `@modelcontextprotocol/sdk` 1.29 |
| LLM | `@anthropic-ai/sdk` 0.98 · `openai` 6.39 |
| PDF | `unpdf` 1.6 |
| Auth | bcrypt + jose (JWT) |
| Validação | zod 4 |
| Lint | Biome |
| Build orchestration | Turborepo |
| Pkg manager | pnpm 10 |

## Mono-repo

```
contextos/
├── apps/web/                   # Next.js 16 (frontend + API + MCP)
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   ├── core/                   # Compartilhado web+worker (storage,
│   │                           # chunking, extractors, embeddings)
│   ├── mcp/                    # MCP server lib placeholder
│   └── worker/                 # BullMQ jobs (indexação)
├── docker/                     # Dockerfiles + Caddyfile + backup script
└── docs/
```

## Schema (12 tabelas)

- **users** — auth
- **workspaces** — top-level (owner = user)
- **projects** — agrupa cérebros relacionados
- **brains** — instância de Canvas (com `currentVersionId`)
- **brain_versions** — snapshots imutáveis (JSON full)
- **nodes** — blocos do canvas (type, title, content, priority, scope, tags, mode, position)
- **edges** — ligações entre nós
- **documents** — arquivos PDF/MD/TXT (status: uploading/indexing/ready/error)
- **knowledge_chunks** — chunks indexados (com `vector(1536)` pra pgvector)
- **memories** — workspace/projeto/execução (com embedding)
- **api_keys** — bcrypt hash + scopes[] (RBAC tag-based)
- **execution_traces** — log imutável de toda consulta (auditoria)

Índices críticos:
```sql
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_memories_embedding ON memories
  USING hnsw (embedding vector_cosine_ops);
```

## Context Compiler — pipeline 8 passos

```
input { workspace_id, brain_id?, scope?, query, task?, format, budget }
  ↓
1. resolveScope         (brain → project → workspace + version)
  ↓
2. loadCandidates       (nodes enabled + memories + chunks)
  ↓
3. filterByRbac         (tag match com wildcards quando Bearer key)
  ↓
4. rankRelevance        (cosine sim se embedding, senão substring)
                        (finalScore = relevance*0.6
                          + priority/100 * 0.3
                          + recencyBoost * 0.1)
  ↓
5. detectConflicts      (warning se 2+ single mesmo type priority próxima)
  ↓
6. orderAndResolveSingle (priority desc, scope specificity desempate;
                          remove duplicados single)
  ↓
7. compressToBudget     (re-sort finalScore, inclui até estourar budget)
  ↓
8. buildPackage         (json/messages/markdown/mcp)
  ↓
9. persistTrace         (execution_traces row imutável)
  ↓
output { package, trace_id, stats }
```

Cache LRU em Redis: SHA-256 do input normalizado → SETEX 5min TTL.

## RBAC tag-based

```
API Key:    scopes = ["public", "commercial", "client:*"]
Bloco:      tags   = ["client:delta", "commercial"]

Match:      TODAS tags do bloco ∈ scopes da key
            ↓
            wildcard match: "client:*" cobre "client:delta"
            ↓
            bloco SEM tags = só visível com scope "public"

Resultado:  bloco entra na resposta
```

Session-based (UI do owner) = pass-through (sem RBAC).

## Auth

- **Internal UI**: cookie session (`contextos_session` httpOnly, JWT HS256 7d)
- **External APIs** (`/v1/*`, `/mcp`): Bearer token `ctx_sk_live_<base64url(32)>`
  - bcrypt hash cost 12
  - lookup otimizado por prefix (16 chars)
  - `lastUsedAt` + `totalRequests` updated async

`authenticateV1Request()` tenta Bearer primeiro, fallback session. Header presente mas inválido = falha (não cai pra cookie).

## MCP Server

Stateless HTTP transport em `/mcp` via `@modelcontextprotocol/sdk`.

5 tools:
- `list_brains`
- `retrieve_context`
- `compile_context`
- `search_memory`
- `save_memory`

Cada request cria server+transport novo com auth context na closure. Workspace scoped — API key carrega seu workspace.

Detalhes: [mcp-guide.md](./mcp-guide.md).

## Worker (BullMQ)

`packages/worker` roda separado do web. Consome queue `document-index`:
1. Marca doc `indexing`
2. Lê arquivo via storage
3. Extract texto (`unpdf` pra PDF, raw utf-8 pra MD/TXT)
4. Chunk ~500 tokens
5. Embed batch (OpenAI text-embedding-3-small, dim 1536) — pula se sem key
6. Insert chunks em transação
7. Marca `ready` ou `error`

Concurrency 2, retry 3x backoff exponencial. Graceful shutdown SIGTERM/SIGINT.

## Storage

`StorageInterface` em `packages/core/storage.ts`. Implementação atual: `FilesystemStorage` (volume Docker em `data/storage`). Path traversal protection. Path shape `XX/<uuid>.<ext>` evita diretórios gigantes.

Próxima fase: adapter S3-compatible (MinIO) sem mudar lib consumer.

## Trace + Observabilidade

Toda chamada `/v1/*` e `/mcp` persiste em `execution_traces`:
- workspace_id, brain_id, brain_version_id
- api_key_id (null se session)
- endpoint, request_payload, response_package_id
- blocks_considered/included/excluded, tokens_estimated
- warnings (array), status_code, duration_ms
- created_at imutável

UI mostra em `/workspaces/[id]/access` com filtros, drill-down em `/traces/[id]`, export CSV.

`/health` checa db + redis pra liveness.

## Próximas evoluções (pós-MVP)

- Sumarização LLM no Compiler (compressão semântica)
- Conflict-judge LLM (semantic conflict detection)
- Agentes executáveis (Tool, Router, Validator nodes)
- Integrações (Drive, Notion, n8n)
- OpenAPI Actions (Custom GPT)
- SDK oficial TS/Python
- Diff visual de versões
- Multi-tenant + SSO/SAML
- Sumarização e re-ranking LLM
- Cloud hospedado (oferta managed)
