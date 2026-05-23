# API Reference

ContextOS expõe 3 superfícies pra IA externa consumir o cérebro:

1. **REST API** — `/v1/*` (Bearer token)
2. **MCP Server** — `/mcp` (Bearer token, JSON-RPC stream)
3. **Internal API** — `/api/*` (cookie session, usado pela UI)

---

## Auth

### Bearer token (external)

Cria key em `/workspaces/[id]/access`. Formato `ctx_sk_live_<base64url(32)>`.

```http
Authorization: Bearer ctx_sk_live_xxxxx
```

Bearer presente mas inválido = `401 unauthenticated` (não tenta cookie).

API keys são scoped a 1 workspace. Tentar acessar outro = `403 workspace_mismatch`.

### Cookie session (internal)

Cookie `contextos_session` httpOnly setado pelo `/api/auth/login`. JWT HS256 com TTL 7 dias. Usado pela própria UI.

### RBAC

Aplicado quando Bearer (não em session). Cada bloco tem `tags[]`, cada key tem `scopes[]`. Bloco entra na resposta se **TODAS** suas tags ∈ scopes. Wildcards: `*` universal, `prefix:*` prefix match.

---

## REST `/v1`

### `POST /v1/context/compile`

Compila pacote de contexto pronto pra IA.

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "brain_id": "brain_xxx",
  "scope": ["client:delta"],
  "task": "criar proposta comercial",
  "query": "info comercial pra Delta",
  "format": "messages",
  "budget_tokens": 4000,
  "consumer": "meu-app"
}
```

| Field | Type | Default | |
|---|---|---|---|
| workspace_id | uuid | — | obrigatório |
| brain_id | uuid | — | opcional (se omitido, todos brains do ws) |
| context_version | string | "latest" | |
| scope | string[] | [] | tags pra filtro semântico |
| task | string | — | opcional |
| query | string | — | obrigatório |
| format | enum | "messages" | json \| messages \| markdown \| mcp |
| budget_tokens | int | 8000 | 100-50000 |
| include_examples | bool | true | |
| consumer | string | — | identificador do client (vai pro trace) |

**Response 200:**
```json
{
  "schema_version": "v1",
  "package_id": "pkg_xxx",
  "trace_id": "trace_xxx",
  "compiled_at": "2026-05-23T...",
  "context_version": "live",
  "messages": [
    {"role": "system", "content": "# Persona\n..."},
    {"role": "system", "content": "# Fatos\n..."},
    {"role": "user", "content": "criar proposta..."}
  ],
  "stats": {
    "tokensEstimated": 3950,
    "blocksConsidered": 23,
    "blocksIncluded": 12,
    "blocksExcluded": 11,
    "warnings": ["..."]
  }
}
```

Headers:
- `X-Cache: HIT` ou `X-Cache: MISS` (cache LRU Redis 5min)

Errors:
- 400 invalid_input
- 401 unauthenticated
- 403 workspace_mismatch
- 404 workspace_not_found
- 500 compile_failed

### `POST /v1/context/retrieve`

Mesma compilação mas retorna blocos brutos rankeados (sem package, sem budget cut).

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "brain_id": "brain_xxx",
  "query": "...",
  "limit": 50
}
```

**Response 200:**
```json
{
  "blocks": [
    {
      "id": "node_xxx",
      "type": "rule",
      "title": "...",
      "content": "...",
      "priority": 90,
      "scope": "projeto",
      "tags": ["public"],
      "relevance_score": 0.85,
      "source": "node",
      "source_id": "brain_xxx"
    }
  ],
  "total": 4,
  "warnings": []
}
```

### `POST /v1/memory/create`

```json
{
  "workspace_id": "ws_xxx",
  "scope_type": "workspace",   // workspace | projeto | execucao
  "scope_id": "ws_xxx",
  "title": "Objeção prazo",     // opcional
  "content": "Cliente Delta rejeitou prazo 6 meses...",
  "tags": ["client:delta", "commercial"]
}
```

**Response 201:**
```json
{ "id": "mem_xxx", "created_at": "2026-05-23T..." }
```

### `POST /v1/memory/search`

```json
{
  "workspace_id": "ws_xxx",
  "scope_type": "workspace",
  "scope_id": "ws_xxx",
  "query": "objeções comerciais",
  "limit": 10
}
```

Usa cosine distance (pgvector) se OpenAI key configurado, senão fallback ILIKE.

**Response 200:**
```json
{
  "memories": [
    {
      "id": "mem_xxx",
      "title": "Objeção prazo",
      "content": "Cliente Delta...",
      "relevance_score": 0.91,
      "tags": ["client:delta"],
      "created_at": "..."
    }
  ],
  "total": 3
}
```

---

### `GET /v1/brains`

Lista cérebros do workspace.

**Query:** `?workspace_id=<uuid>` (obrigatório)

**Auth:** Bearer ou cookie.

**200:**
```json
{
  "workspace_id": "uuid",
  "brains": [
    {
      "id": "uuid",
      "name": "Agente comercial",
      "description": null,
      "project_id": "uuid",
      "project_name": "Vendas",
      "current_version_id": "uuid|null",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "total": 1
}
```

---

### `GET /v1/documents`

Lista documentos de um cérebro.

**Query:** `?brain_id=<uuid>` (obrigatório)

**Auth:** Bearer ou cookie.

**200:**
```json
{
  "brain_id": "uuid",
  "documents": [
    {
      "id": "uuid",
      "file_name": "manual.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 12345,
      "status": "ready",
      "chunk_count": 42,
      "created_at": "ISO8601"
    }
  ],
  "total": 1
}
```

### `POST /v1/documents`

Upload (multipart/form-data). Worker indexa em background.

**Form fields:**
- `brain_id` (string, uuid) — obrigatório
- `file` (binary, .pdf .md .txt, max 25MB) — obrigatório

**Auth:** Bearer ou cookie.

**201:**
```json
{
  "id": "uuid",
  "file_name": "...",
  "mime_type": "...",
  "size_bytes": 0,
  "status": "uploading",
  "created_at": "ISO8601"
}
```

### `DELETE /v1/documents/{id}`

Apaga documento + chunks indexados + arquivo no storage.

**200:** `{ "ok": true }`

---

## MCP `/mcp`

Implementa Model Context Protocol v1 sobre HTTP streamable. Suportado por: Claude Desktop, Cursor, Cline, Zed, qualquer cliente MCP.

Bearer obrigatório (cookie session só → 403).

### Tools

| Tool | Inputs | Retorna |
|---|---|---|
| `list_brains` | — | `{ brains: [{ id, name, project_id, project_name }], total }` |
| `retrieve_context` | `query`, `brain_id?`, `task?`, `scope?`, `limit?` | `{ blocks: [...], total, warnings }` |
| `compile_context` | `query`, `brain_id?`, `format?` (markdown/json/messages), `budget_tokens?` | texto markdown ou JSON |
| `search_memory` | `scope_type`, `query`, `scope_id?`, `limit?` | `{ memories: [...], total }` |
| `save_memory` | `content`, `scope_type?`, `scope_id?`, `title?`, `tags?` | `{ id, created_at, has_embedding }` |

Config Claude Desktop e exemplos: [mcp-guide.md](./mcp-guide.md).

---

## Internal API (cookie auth)

Não documentar em detalhes — usado só pela UI. Endpoints relevantes:

```
POST /api/auth/{signup,login,logout}
GET  /api/me
GET/POST/PATCH/DELETE /api/workspaces[/:id]
GET/POST/PATCH/DELETE /api/projects[/:id]
GET/POST/PATCH/DELETE /api/brains[/:id]
GET/POST/PATCH/DELETE /api/api-keys[/:id]
POST /api/brains/[id]/documents (multipart)
DELETE /api/documents/[id]
POST /api/brains/[id]/test (chama LLM real pra preview)
GET  /api/brains/[id]/versions
GET  /api/workspaces/[id]/traces/export (CSV)
```

---

## Rate limiting

Token bucket Redis 100 req/min por API key (default, override via env futuro). Fail-open se Redis cair.

---

## Health

```http
GET /health → 200 ok | 503 degraded
```

```json
{
  "status": "ok",
  "uptime_seconds": 123,
  "timestamp": "...",
  "checks": {
    "db": { "ok": true, "latency_ms": 12 },
    "redis": { "ok": true, "latency_ms": 3 }
  }
}
```
