# PRD Técnico — ContextOS v0.1

> **Status:** Draft fechado para implementação
> **Data:** 2026-05-23
> **Autor:** Julio Karvouniaris + IA assistente
> **Briefing-base:** [briefing_plataforma_inteligencia_contextual.md](./briefing_plataforma_inteligencia_contextual.md)

---

## 1. Visão e tese

### 1.1 O que é o ContextOS

**ContextOS é um servidor de contexto operacional plugável** (Context-as-a-Service).

Empresas e indivíduos modelam contexto (memória, regras, conhecimento, persona, processos) UMA vez em um canvas visual. Qualquer IA da stack (Claude Desktop, ChatGPT, Cursor, n8n, agentes próprios) pluga via REST API, MCP Server, OpenAPI Actions, Webhooks ou SDK — e recebe um pacote de contexto compilado especificamente pra tarefa que vai executar.

### 1.2 Tese central

> "Modelos são substituíveis. Contexto proprietário não é."

ContextOS desloca o foco de "construir mais um agente" para "construir o cérebro que alimenta todos os agentes". Modelos LLM mudam a cada 6 meses; contexto institucional (decisões, memórias, regras, processos) é o ativo permanente da empresa.

### 1.3 Por que existe

Empresas e profissionais usam IA de forma fragmentada:
- Conversas soltas em chats sem persistência
- Prompts perdidos, reescritos
- Documentos espalhados em Drive/Notion/email/CRM
- Cada IA tem cópia diferente do contexto
- Trocar de IA = remontar tudo
- Sem rastreabilidade de quais fontes influenciaram cada resposta
- Sem governança sobre quem acessa o quê

ContextOS resolve criando uma **camada universal de contexto** que qualquer IA consome.

### 1.4 Diferencial defensável

| Concorrente | O que faz | Onde ContextOS quebra padrão |
|---|---|---|
| Langflow/Flowise | Canvas drag-drop de prompts/agentes | Foco em execução, não em contexto. Sem hierarquia/escopo. |
| Dify | Canvas + RAG + deploy app | Contexto preso por app, sem camada institucional plugável. |
| n8n | Automação workflow | IA é cidadã de 2ª classe. Sem semântica de contexto. |
| mem0 / Letta | Memory APIs headless | Sem canvas visual, sem hierarquia, sem governança. |
| Stack AI / Voiceflow | Canvas vertical (chat/voz) | Específico. Sem multi-IA. |

**ContextOS é a primeira plataforma que combina**: canvas visual + contexto-como-primitiva + hierarquia/escopo/prioridade + API plugável universal (REST + MCP + Webhook).

---

## 2. Escopo v0.1

### 2.1 Dentro do MVP

**Core funcional:**
- Auth simples (email/senha + API keys locais)
- Workspaces / Projetos / Cérebros (Canvas)
- 7 tipos de nó (Context Block, Persona, Rule, Memory, Document, Knowledge, Output Template)
- 3 tipos de memória (workspace, projeto, execução)
- Upload de documentos (PDF, MD, TXT)
- Indexação (chunking + embeddings + pgvector)
- Busca semântica
- Snapshot bruto de versão

**Context Compiler:**
- Pipeline 8 passos algorítmico (sem LLM no caminho crítico)
- Cache por hash de blocos selecionados
- Determinístico (mesmo input = mesmo output)

**Access Layer:**
- REST API: `/v1/context/retrieve`, `/v1/context/compile`, `/v1/memory/search`, `/v1/memory/create`, `/v1/brains`
- MCP Server (Anthropic Model Context Protocol) — dia 1
- API Keys com scopes (RBAC tag-based, default-deny, wildcards)
- 4 formatos de saída: `json`, `messages`, `markdown`, `mcp`

**Governança:**
- Tela "Acesso ao Cérebro" (gestão de keys, endpoints, logs)
- Rastreabilidade (trace por consulta com blocos usados, cortados, warnings)

**Opcional:**
- Botão "Testar" com 1 provedor configurável (preview de execução interna)

### 2.2 Fora do MVP (fase 2+)

- Agentes executáveis com tools
- Fluxo multiagente (Router, Validator, Critic)
- Templates marketplace
- Integrações específicas (Drive, Notion, CRM, n8n) via conectores dedicados
- White-label, SSO/SAML, multi-tenant formal
- Webhooks de entrada (cérebro recebe triggers externos)
- Billing, analytics avançado, dashboards de uso
- OpenAPI Actions para Custom GPT
- SDK oficial Python/TS
- Diff visual de versões, branch/merge
- Sumarização LLM no Compiler
- Conflict-judge LLM no Compiler

---

## 3. Personas

### 3.1 ICP Primária (MVP — adoção)

**Dev / Founder solo IA-pesado**

| Atributo | Valor |
|---|---|
| Perfil | Dev independente, founder de SaaS, freela técnico, AI-engineer |
| Stack diária | Claude Desktop, Cursor, ChatGPT, n8n, agentes próprios, Vercel/Railway |
| Dor exata | Repete contexto em 5+ lugares; cada IA responde diferente pra mesma pergunta; perde edits |
| Disposição a pagar | Baixa-média ($0-100/mês); espera open-source antes |
| Critério de adoção | GitHub stars/atividade, docs caprichadas, instala em 5min, MCP funciona dia 1 |
| Como descobre | HN, Twitter/X (AI Twitter), GitHub trending, posts de outros devs |

### 3.2 ICP Secundária (fase 2 — receita)

**Consultor / Agência IA**

| Atributo | Valor |
|---|---|
| Perfil | Consultoria que monta cérebros pra clientes B2B; agências de IA |
| Stack diária | Múltiplos workspaces (1 por cliente), templates reutilizáveis |
| Dor exata | Cada cliente reinventa estrutura; sem reuso de patterns; entrega frágil |
| Disposição a pagar | Média-alta ($100-500/mês por workspace) |
| Critério de adoção | Templates premium, white-label leve, suporte ágil, multi-workspace |

---

## 4. User stories (priorizadas)

### 4.1 Onboarding (P0)

```
US-01 [P0]: Como dev, quero baixar e rodar ContextOS localmente em <10 min via
            `docker compose up` pra testar antes de comprometer.
US-02 [P0]: Como dev, quero criar conta com email/senha e entrar.
US-03 [P0]: Como dev, quero criar meu primeiro workspace com 1 click.
```

### 4.2 Modelagem de contexto (P0)

```
US-04 [P0]: Como builder, quero criar um cérebro novo (Canvas) dentro de um projeto.
US-05 [P0]: Como builder, quero adicionar blocos de contexto arrastando do painel
            lateral (Persona, Rule, Memory, Context Block, Document, Knowledge,
            Output Template).
US-06 [P0]: Como builder, quero editar cada bloco com título, conteúdo, prioridade
            (slider 30-100), escopo (dropdown), tags (chips), modo (single/multi).
US-07 [P0]: Como builder, quero conectar blocos pra mostrar relações conceituais
            (edges informacionais — não controlam fluxo no MVP).
US-08 [P0]: Como builder, quero salvar o cérebro e ver versões anteriores.
US-09 [P0]: Como builder, quero fazer upload de PDF/MD/TXT e ver chunks indexados
            como blocos Knowledge.
```

### 4.3 Consulta e compilação (P0)

```
US-10 [P0]: Como builder, quero ver preview do contexto compilado pra uma query
            de teste (tipo "dry run").
US-11 [P0]: Como builder, quero ver no preview: quais blocos entraram, quais
            ficaram fora, por que (prioridade/budget), warnings de conflito.
US-12 [P0]: Como builder, quero opcional executar a query num provedor LLM
            (Claude OU OpenAI) pra ver resposta real.
```

### 4.4 Acesso externo (P0)

```
US-13 [P0]: Como dev, quero criar uma API Key nomeada com scopes específicos.
US-14 [P0]: Como dev, quero copiar a URL do MCP server e a API Key pra colar no
            Claude Desktop (config.json).
US-15 [P0]: Como dev, quero ver logs de quais keys consultaram o cérebro, quando,
            quanto retornou.
US-16 [P0]: Como dev, quero revogar uma key.
```

### 4.5 Governança (P1)

```
US-17 [P1]: Como dev, quero adicionar tags em blocos pra controlar quem acessa.
US-18 [P1]: Como dev, quero exportar logs em CSV pra auditoria.
US-19 [P1]: Como dev, quero filtrar logs por key, endpoint, data.
```

### 4.6 Memória (P1)

```
US-20 [P1]: Como builder, quero criar memórias manuais associadas a workspace/projeto.
US-21 [P1]: Como builder, quero que memórias geradas em execuções sejam opcionalmente
            persistidas com 1 click.
US-22 [P1]: Como dev consumindo a API, quero salvar memórias via `/v1/memory/create`
            durante interação com IA.
```

---

## 5. Requisitos funcionais

### 5.1 Módulo Auth
- RF-AUTH-01: Cadastro via email + senha (mínimo 8 chars).
- RF-AUTH-02: Login via email + senha, JWT em cookie httpOnly.
- RF-AUTH-03: Logout invalida sessão.
- RF-AUTH-04: Recuperar senha via email (P1, fora MVP estrito).
- RF-AUTH-05: API Keys são entidade separada de user auth; cada key gerada e mostrada 1x.

### 5.2 Módulo Workspace/Projeto/Cérebro
- RF-WS-01: User cria workspace com nome único.
- RF-WS-02: Workspace contém N projetos.
- RF-WS-03: Projeto contém N cérebros.
- RF-WS-04: Cérebro é uma instância de Canvas com nodes + edges + metadata.

### 5.3 Módulo Canvas
- RF-CAN-01: Canvas renderiza com React Flow em pan/zoom infinito.
- RF-CAN-02: Painel lateral lista 7 tipos de nó arrastáveis.
- RF-CAN-03: Drop em canvas cria nó com defaults sensatos.
- RF-CAN-04: Click em nó abre painel de propriedades à direita.
- RF-CAN-05: Edge conecta source→target (validação: tipos compatíveis = todos no MVP).
- RF-CAN-06: Auto-save com debounce 2s.

### 5.4 Módulo Nodes
Para cada tipo (Context Block, Persona, Rule, Memory, Document, Knowledge, Output Template):
- RF-NODE-01: Campos comuns: `id`, `title`, `content`, `priority` (30-100, default 50), `scope` (enum), `tags` (string[]), `mode` (single/multi, default conforme tipo), `enabled` (bool, default true), `position` (x,y).
- RF-NODE-02: Campos específicos por tipo:
  - **Persona**: `mode=single` forçado; campo extra `style_notes` (opcional).
  - **Rule**: `priority` mínimo 75 (regras devem ser fortes).
  - **Document**: campo `file_ref` (path no storage); `mime_type`.
  - **Knowledge**: campo `chunks` (gerado por worker após upload); `embedding_model`.
  - **Output Template**: `mode=single` forçado; `template_format` (markdown/json/etc).
- RF-NODE-03: Edit inline ou no painel direito.
- RF-NODE-04: Delete com confirmação.
- RF-NODE-05: Duplicate node (P1).

### 5.5 Módulo Documentos / Knowledge
- RF-DOC-01: Upload PDF/MD/TXT (max 25MB no MVP).
- RF-DOC-02: Worker extrai texto, faz chunking (split por parágrafo + max 500 tokens), gera embeddings, salva em pgvector.
- RF-DOC-03: Cada chunk vira bloco Knowledge associado ao Document.
- RF-DOC-04: User vê status "indexando..." com progresso.
- RF-DOC-05: Delete de Document remove chunks + embeddings.

### 5.6 Módulo Memória
- RF-MEM-01: Memória tem: `id`, `scope_type` (workspace/projeto/execução), `scope_id`, `title`, `content`, `created_at`, `tags`.
- RF-MEM-02: Criar via UI (formulário simples) ou via API `/v1/memory/create`.
- RF-MEM-03: Busca via `/v1/memory/search` por similaridade (embedding da query vs memórias do escopo).
- RF-MEM-04: Memória de escopo "execução" é criada como subproduto de uma consulta, opcionalmente promovida pra workspace/projeto.

### 5.7 Módulo Context Compiler
- RF-CC-01: Endpoint `POST /v1/context/compile` aceita request schema (ver §9).
- RF-CC-02: Pipeline 8 passos executado em ordem (ver §11).
- RF-CC-03: Resposta em ≤ 500ms para budget ≤ 8k tokens (sem RAG pesado).
- RF-CC-04: Cache LRU por hash de (workspace_id + brain_version + scope + query). TTL 5min.
- RF-CC-05: Trace persistido em tabela `execution_traces` com referência ao package.

### 5.8 Módulo RBAC
- RF-RBAC-01: API Key tem: `id`, `name`, `key_hash`, `scopes[]`, `created_at`, `revoked_at`.
- RF-RBAC-02: Chave secreta só mostrada na criação (hash bcrypt no banco).
- RF-RBAC-03: Bloco tem `tags[]`; consulta com key retorna blocos onde `tags ⊆ scopes` (estrita).
- RF-RBAC-04: Default-deny: key nova sem scopes só vê blocos com tag `public`.
- RF-RBAC-05: Wildcard prefix: scope `client:*` cobre tags `client:delta`, `client:acme`.
- RF-RBAC-06: Revoke marca `revoked_at`; respostas subsequentes retornam HTTP 401.

### 5.9 Módulo MCP Server
- RF-MCP-01: Endpoint `/mcp` implementa Model Context Protocol v1.
- RF-MCP-02: Expõe tools:
  - `retrieve_context(scope, query, task?)` → contexto bruto
  - `compile_context(scope, task, query, format, budget_tokens)` → package compilado
  - `search_memory(scope, query)` → memórias
  - `list_brains()` → cérebros disponíveis
- RF-MCP-03: Autenticação via Bearer token (API Key) no header.
- RF-MCP-04: Compatível com Claude Desktop, Cursor, qualquer cliente MCP padrão.

### 5.10 Módulo Versionamento
- RF-VER-01: Save de canvas gera snapshot JSON imutável com `version_id`, `created_at`, `user_id`, `description?`.
- RF-VER-02: Lista de versões ordenadas por data desc.
- RF-VER-03: Restore: cria nova versão a partir da selecionada (sem destruir histórico).
- RF-VER-04: API `compile` aceita parâmetro `context_version` (default "latest").

---

## 6. Requisitos não-funcionais

### 6.1 Performance
- RNF-PERF-01: `/v1/context/compile` p95 ≤ 500ms para budget ≤ 8k tokens.
- RNF-PERF-02: `/v1/context/retrieve` p95 ≤ 300ms.
- RNF-PERF-03: Indexação de PDF 100 páginas ≤ 60s em hardware modesto.
- RNF-PERF-04: Canvas com 100 nós + 200 edges renderiza em ≤ 100ms.

### 6.2 Segurança
- RNF-SEC-01: Senhas com bcrypt (cost 12).
- RNF-SEC-02: API Keys com bcrypt + prefix `ctx_sk_live_`.
- RNF-SEC-03: Default-deny em RBAC.
- RNF-SEC-04: CORS configurável (default allow `*` em self-hosted).
- RNF-SEC-05: Rate limit por API Key: 100 req/min (configurável).
- RNF-SEC-06: SQL via Drizzle (sem string concat).
- RNF-SEC-07: Audit log immutable (append-only).

### 6.3 Escalabilidade
- RNF-SCALE-01: Single-node target: 1 workspace, 50 cérebros, 10k blocos, 1k API calls/dia.
- RNF-SCALE-02: Worker BullMQ pode rodar em processo separado.
- RNF-SCALE-03: Postgres + Redis horizontalmente escaláveis (preparado, não usado no MVP).

### 6.4 Observabilidade
- RNF-OBS-01: Logs estruturados via Pino (JSON).
- RNF-OBS-02: Trace de toda consulta API gravado em `execution_traces`.
- RNF-OBS-03: Métricas básicas expostas em `/metrics` (Prometheus format, P1).

### 6.5 Confiabilidade
- RNF-REL-01: Workers BullMQ com retry 3x + backoff exponencial.
- RNF-REL-02: Backup automático Postgres (dump diário em volume Docker).
- RNF-REL-03: Health endpoint `/health` retorna status DB + Redis.

### 6.6 Usabilidade
- RNF-UX-01: First-canvas-render em < 30s desde signup.
- RNF-UX-02: Drag-drop de nó funciona em browsers modernos (Chrome/Firefox/Safari últimas 2 versões).
- RNF-UX-03: Mobile: visualização read-only (edit no MVP só desktop).

### 6.7 Internacionalização
- RNF-I18N-01: UI inicial em PT-BR. EN-US estrutura preparada (i18n.json), entrega na fase 2.

---

## 7. Arquitetura técnica

### 7.1 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│ HUMAN LAYER                                                 │
│ Next.js App Router (RSC + Client Components)                │
│ ├── Dashboard                                               │
│ ├── Canvas Builder (React Flow)                             │
│ ├── Biblioteca (templates, blocos reutilizáveis — P1)       │
│ ├── Memórias (CRUD)                                         │
│ └── Governança / Acesso ao Cérebro                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BRAIN LAYER (lógica de domínio)                             │
│ packages/core (TS lib compartilhada)                        │
│ ├── ContextGraph (nodes + edges + resolução)                │
│ ├── MemoryStore (CRUD + busca semântica)                    │
│ ├── KnowledgeIndex (chunks + embeddings)                    │
│ ├── RulesEngine (avaliação de regras single/multi)          │
│ ├── ContextCompiler (pipeline 8 passos)                     │
│ └── TraceStore (logs immutables)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ACCESS LAYER (interfaces de consumo)                        │
│ Next.js Route Handlers + MCP Server                         │
│ ├── REST API (/v1/*)                                        │
│ ├── MCP Server (/mcp)                                       │
│ ├── Webhooks (P1, fora MVP)                                 │
│ └── OpenAPI schema (auto-gerado)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ AI LAYER (consumidores externos)                            │
│ Claude Desktop · Cursor · ChatGPT (via Action) · n8n        │
│ Agentes próprios · Apps internos · qualquer cliente MCP/REST│
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Infraestrutura

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Caddy      │──────▶│   Next.js    │──────▶│  PostgreSQL  │
│ (HTTPS auto) │       │  (web + api) │       │  + pgvector  │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐       ┌──────────────┐
                       │    Redis     │◀─────▶│  Worker      │
                       │ (cache+queue)│       │  (BullMQ)    │
                       └──────────────┘       └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │  Filesystem  │
                                              │  (storage)   │
                                              └──────────────┘
```

### 7.3 Bibliotecas-chave

| Pacote | Versão alvo | Propósito |
|---|---|---|
| `next` | 16.x | Framework full-stack |
| `react` | 19.x | UI |
| `reactflow` | 12.x | Canvas |
| `@radix-ui/*` + `shadcn/ui` | latest | Componentes base |
| `tailwindcss` | 4.x | Styling |
| `zustand` | 5.x | State local (canvas state) |
| `@tanstack/react-query` | 5.x | Server state |
| `drizzle-orm` + `drizzle-kit` | latest | ORM + migrations |
| `pg` | 8.x | Driver Postgres |
| `redis` + `bullmq` | latest | Cache + queue + worker |
| `@anthropic-ai/sdk` | latest | Cliente Anthropic |
| `@modelcontextprotocol/sdk` | latest | MCP server SDK |
| `ai` (Vercel AI SDK) | 6.x | Abstração de provedores LLM |
| `unpdf` | latest | PDF parsing |
| `pino` + `pino-http` | latest | Logs estruturados |
| `bcrypt` | latest | Hash de senhas/keys |
| `jose` | latest | JWT |
| `zod` | latest | Validação de schemas |

---

## 8. Schema de banco (Drizzle TS)

### 8.1 Tabelas principais

```typescript
// packages/db/schema.ts

import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, pgEnum, vector } from 'drizzle-orm/pg-core'

// Enums
export const scopeTypeEnum = pgEnum('scope_type', [
  'global', 'workspace', 'empresa', 'projeto', 'cliente',
  'processo', 'agente', 'execucao', 'temporario'
])

export const nodeTypeEnum = pgEnum('node_type', [
  'context_block', 'persona', 'rule', 'memory',
  'document', 'knowledge', 'output_template'
])

export const memoryScopeEnum = pgEnum('memory_scope', [
  'workspace', 'projeto', 'execucao'
])

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Projects
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Brains (Canvas)
export const brains = pgTable('brains', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  currentVersionId: uuid('current_version_id'),  // FK soft pra brain_versions
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Brain Versions (snapshots imutáveis)
export const brainVersions = pgTable('brain_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id').references(() => brains.id).notNull(),
  snapshot: jsonb('snapshot').notNull(),  // { nodes, edges, metadata }
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Nodes (estado atual do canvas — versionado via brain_versions)
export const nodes = pgTable('nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id').references(() => brains.id).notNull(),
  type: nodeTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  priority: integer('priority').default(50).notNull(),  // 30-100
  scope: scopeTypeEnum('scope').default('projeto').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  mode: text('mode', { enum: ['single', 'multi'] }).default('multi').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  positionX: integer('position_x').default(0).notNull(),
  positionY: integer('position_y').default(0).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),  // campos específicos do tipo
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Edges (informacionais no MVP)
export const edges = pgTable('edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id').references(() => brains.id).notNull(),
  sourceNodeId: uuid('source_node_id').references(() => nodes.id).notNull(),
  targetNodeId: uuid('target_node_id').references(() => nodes.id).notNull(),
  label: text('label')
})

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id').references(() => brains.id).notNull(),
  fileName: text('file_name').notNull(),
  fileRef: text('file_ref').notNull(),  // path no storage
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: text('status', { enum: ['uploading', 'indexing', 'ready', 'error'] }).default('uploading').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Knowledge chunks (com embedding)
export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  brainId: uuid('brain_id').references(() => brains.id).notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokens: integer('tokens').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),  // OpenAI ada-002 / text-embedding-3-small
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Memories
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  scopeType: memoryScopeEnum('scope_type').notNull(),
  scopeId: uuid('scope_id').notNull(),  // FK polimórfica pra workspace/project/execution
  title: text('title'),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// API Keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),  // bcrypt do segredo
  keyPrefix: text('key_prefix').notNull(),  // primeiros 8 chars pra display
  scopes: jsonb('scopes').$type<string[]>().default([]).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  totalRequests: integer('total_requests').default(0).notNull(),
  revokedAt: timestamp('revoked_at'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Execution Traces (logs immutables)
export const executionTraces = pgTable('execution_traces', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  brainId: uuid('brain_id').references(() => brains.id),
  brainVersionId: uuid('brain_version_id').references(() => brainVersions.id),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id),
  endpoint: text('endpoint').notNull(),  // ex: /v1/context/compile
  requestPayload: jsonb('request_payload').notNull(),
  responsePackageId: text('response_package_id'),
  blocksConsidered: integer('blocks_considered').default(0).notNull(),
  blocksIncluded: integer('blocks_included').default(0).notNull(),
  blocksExcluded: integer('blocks_excluded').default(0).notNull(),
  tokensEstimated: integer('tokens_estimated').default(0).notNull(),
  warnings: jsonb('warnings').$type<string[]>().default([]).notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
```

### 8.2 Índices críticos

```sql
-- pgvector pra busca semântica
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_memories_embedding ON memories
  USING hnsw (embedding vector_cosine_ops);

-- Lookup frequente
CREATE INDEX idx_nodes_brain_enabled ON nodes (brain_id) WHERE enabled = true;
CREATE INDEX idx_nodes_tags ON nodes USING gin (tags);
CREATE INDEX idx_traces_workspace_created ON execution_traces (workspace_id, created_at DESC);
CREATE INDEX idx_api_keys_workspace ON api_keys (workspace_id) WHERE revoked_at IS NULL;
```

---

## 9. Endpoints API completos

### 9.1 Padrão geral

- Base path: `/v1`
- Auth: header `Authorization: Bearer <api_key>` (para endpoints externos) ou cookie de sessão (para UI interna)
- Content-Type: `application/json`
- Erros: corpo `{ "error": "code", "message": "...", "details": {} }`

### 9.2 `POST /v1/context/retrieve`

Busca contexto bruto (sem compilação).

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "brain_id": "brain_xxx",        // opcional — se omitido, busca em todos os brains acessíveis
  "scope": ["client:delta"],       // opcional — lista de tags/escopos
  "query": "informações comerciais relevantes",
  "task": "criar_proposta",        // opcional, texto livre pra ranking
  "limit": 50                       // opcional, default 100
}
```

**Response 200:**
```json
{
  "blocks": [
    {
      "id": "node_xxx",
      "type": "context_block",
      "title": "Política Comercial 2024",
      "content": "...",
      "priority": 85,
      "scope": "workspace",
      "tags": ["commercial", "public"],
      "relevance_score": 0.94,
      "source_id": "doc_xxx"
    }
  ],
  "total": 12,
  "trace_id": "trace_xxx"
}
```

### 9.3 `POST /v1/context/compile`

Compila contexto pronto pra IA consumir.

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "brain_id": "brain_xxx",
  "context_version": "latest",     // opcional, default "latest"
  "scope": ["client:delta"],
  "task": "criar_proposta_comercial",
  "query": "info comercial relevante pra Delta",
  "format": "messages",            // "json" | "messages" | "markdown" | "mcp"
  "budget_tokens": 4000,            // opcional, default 8000
  "include_examples": true,         // opcional, default true
  "consumer": "claude-comercial"   // opcional, default = nome da API key
}
```

**Response 200 (format=messages):**
```json
{
  "schema_version": "v1",
  "package_id": "pkg_xxx",
  "trace_id": "trace_xxx",
  "compiled_at": "2026-05-23T10:00:00Z",
  "context_version": "v2.3",
  "messages": [
    {
      "role": "system",
      "content": "# Persona\nVocê é consultor sênior...\n\n# Regras\n- Não prometer ROI..."
    },
    {
      "role": "system",
      "content": "# Fatos\n- Cliente...\n\n# Memórias\n- ..."
    }
  ],
  "stats": {
    "tokens_estimated": 3950,
    "blocks_considered": 23,
    "blocks_included": 12,
    "blocks_excluded": 11,
    "warnings": ["2 personas com prioridade próxima — escopo desempatou em favor de client:delta"]
  }
}
```

### 9.4 `POST /v1/memory/search`

Busca memórias por similaridade.

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "scope_type": "workspace",   // "workspace" | "projeto" | "execucao"
  "scope_id": "ws_xxx",
  "query": "objeções comerciais anteriores",
  "limit": 10
}
```

**Response 200:**
```json
{
  "memories": [
    {
      "id": "mem_xxx",
      "title": "Objeção de prazo",
      "content": "Cliente rejeitou proposta anterior por prazo longo",
      "relevance_score": 0.91,
      "tags": ["commercial"],
      "created_at": "2026-04-12T..."
    }
  ],
  "total": 3
}
```

### 9.5 `POST /v1/memory/create`

Salva nova memória.

**Request:**
```json
{
  "workspace_id": "ws_xxx",
  "scope_type": "projeto",
  "scope_id": "proj_xxx",
  "title": "Aprendizado sobre Delta",
  "content": "Decisor prefere resumos objetivos sem mais que 1 página",
  "tags": ["client:delta", "commercial"]
}
```

**Response 201:**
```json
{
  "id": "mem_xxx",
  "created_at": "2026-05-23T..."
}
```

### 9.6 `GET /v1/brains`

Lista cérebros acessíveis pela API key.

**Response 200:**
```json
{
  "brains": [
    {
      "id": "brain_xxx",
      "name": "Cérebro Comercial",
      "workspace_id": "ws_xxx",
      "project_id": "proj_xxx",
      "current_version_id": "ver_xxx",
      "node_count": 47
    }
  ]
}
```

### 9.7 Endpoints UI internos (sessão de user)

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/me

GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
PATCH  /api/workspaces/:id
DELETE /api/workspaces/:id

GET    /api/workspaces/:wsId/projects
POST   /api/workspaces/:wsId/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id

GET    /api/projects/:projId/brains
POST   /api/projects/:projId/brains
GET    /api/brains/:id
PATCH  /api/brains/:id  (rename, etc)
DELETE /api/brains/:id
POST   /api/brains/:id/save  (cria snapshot)
GET    /api/brains/:id/versions
POST   /api/brains/:id/restore  (body: { version_id })

GET    /api/brains/:brainId/nodes
POST   /api/brains/:brainId/nodes
PATCH  /api/nodes/:id
DELETE /api/nodes/:id

GET    /api/brains/:brainId/edges
POST   /api/brains/:brainId/edges
DELETE /api/edges/:id

POST   /api/brains/:brainId/documents  (multipart upload)
GET    /api/brains/:brainId/documents
DELETE /api/documents/:id

GET    /api/workspaces/:wsId/api-keys
POST   /api/workspaces/:wsId/api-keys  (cria, retorna chave 1x)
PATCH  /api/api-keys/:id  (editar scopes)
DELETE /api/api-keys/:id  (revoga)

GET    /api/workspaces/:wsId/traces  (filtros: api_key_id, endpoint, date_from, date_to)
GET    /api/workspaces/:wsId/traces/export.csv

POST   /api/brains/:brainId/preview  (dry-run compile sem RBAC, retorna package + trace)
POST   /api/brains/:brainId/test     (executa com provedor configurado — opcional)
```

---

## 10. Spec MCP Server

### 10.1 Endpoint

`POST /mcp` — implementa Model Context Protocol v1 (JSON-RPC sobre HTTP).

### 10.2 Auth

Header: `Authorization: Bearer ctx_sk_live_xxx`

### 10.3 Tools expostas

```typescript
// tool: retrieve_context
{
  name: "retrieve_context",
  description: "Busca contexto bruto do cérebro por escopo e query",
  inputSchema: {
    type: "object",
    properties: {
      scope: { type: "array", items: { type: "string" } },
      query: { type: "string" },
      task: { type: "string" },
      limit: { type: "integer", default: 50 }
    },
    required: ["query"]
  }
}

// tool: compile_context
{
  name: "compile_context",
  description: "Compila pacote de contexto pronto pra usar como input de IA",
  inputSchema: {
    type: "object",
    properties: {
      scope: { type: "array", items: { type: "string" } },
      task: { type: "string" },
      query: { type: "string" },
      format: { type: "string", enum: ["messages", "markdown", "json"], default: "markdown" },
      budget_tokens: { type: "integer", default: 4000 }
    },
    required: ["query"]
  }
}

// tool: search_memory
{
  name: "search_memory",
  description: "Busca memórias do cérebro por similaridade",
  inputSchema: {
    type: "object",
    properties: {
      scope_type: { type: "string", enum: ["workspace", "projeto", "execucao"] },
      scope_id: { type: "string" },
      query: { type: "string" },
      limit: { type: "integer", default: 10 }
    },
    required: ["scope_type", "query"]
  }
}

// tool: save_memory
{
  name: "save_memory",
  description: "Salva nova memória no cérebro",
  inputSchema: {
    type: "object",
    properties: {
      scope_type: { type: "string", enum: ["workspace", "projeto", "execucao"] },
      scope_id: { type: "string" },
      title: { type: "string" },
      content: { type: "string" },
      tags: { type: "array", items: { type: "string" } }
    },
    required: ["scope_type", "scope_id", "content"]
  }
}

// tool: list_brains
{
  name: "list_brains",
  description: "Lista cérebros disponíveis pra esta API key",
  inputSchema: { type: "object", properties: {} }
}
```

### 10.4 Config Claude Desktop (exemplo pro usuário)

```json
{
  "mcpServers": {
    "contextos": {
      "url": "https://meu-cerebro.com/mcp",
      "headers": {
        "Authorization": "Bearer ctx_sk_live_xxx"
      }
    }
  }
}
```

---

## 11. Spec Context Compiler — pseudocódigo

```typescript
// packages/core/compiler.ts

interface CompileRequest {
  workspaceId: string
  brainId: string
  contextVersion?: string  // "latest" or specific version_id
  scope: string[]
  task?: string
  query: string
  format: 'json' | 'messages' | 'markdown' | 'mcp'
  budgetTokens: number     // default 8000
  apiKeyId: string
  consumer?: string
}

interface CompileResponse {
  packageId: string
  traceId: string
  contextVersion: string
  package: ContextPackage  // dependendo do format
  stats: CompileStats
}

async function compile(req: CompileRequest): Promise<CompileResponse> {
  const traceId = generateId('trace')
  const startedAt = Date.now()
  const warnings: string[] = []

  // 1. RESOLVER ESCOPO
  const brain = await loadBrain(req.brainId, req.contextVersion)
  const apiKey = await loadApiKey(req.apiKeyId)
  const effectiveScopes = expandWildcards(apiKey.scopes)

  // 2. CARREGAR BLOCOS ATIVOS (com RBAC)
  let blocks = await loadNodes(brain.id, { enabled: true })
  blocks = blocks.filter(b => tagsMatchScopes(b.tags, effectiveScopes))
  blocks = blocks.filter(b => req.scope.length === 0 || scopeMatches(b.scope, req.scope))
  const blocksConsidered = blocks.length

  // 3. RANKEAR RELEVÂNCIA
  const queryEmbedding = await embed(req.query)
  for (const block of blocks) {
    if (block.type === 'knowledge') {
      block.relevanceScore = cosineSimilarity(queryEmbedding, block.embedding)
    } else {
      // blocos não-indexados: similaridade textual simples (BM25-lite) ou similaridade por título
      block.relevanceScore = textSimilarity(req.query, block.title + ' ' + block.content)
    }
    // Boost por prioridade e recência
    block.finalScore = block.relevanceScore * 0.6
                    + (block.priority / 100) * 0.3
                    + recencyBoost(block.updatedAt) * 0.1
  }

  // 4. DETECTAR CONFLITO
  const singleTypeGroups = groupBy(blocks, b => b.type, b => b.mode === 'single')
  for (const [type, group] of singleTypeGroups) {
    if (group.length > 1) {
      const priorities = group.map(b => b.priority)
      const range = Math.max(...priorities) - Math.min(...priorities)
      if (range <= 5) {
        warnings.push(`Conflito potencial: ${group.length} blocos do tipo "${type}" com prioridades próximas (range ${range})`)
      }
    }
  }

  // 5. APLICAR ORDEM DE PRIORIDADE + ESCOPO DESEMPATE
  blocks.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    return scopeSpecificity(b.scope) - scopeSpecificity(a.scope)
  })

  // Resolver "single" mode: pra cada tipo single, manter só o vencedor
  const singleTypes = new Set<string>()
  blocks = blocks.filter(b => {
    if (b.mode === 'single') {
      if (singleTypes.has(b.type)) return false
      singleTypes.add(b.type)
    }
    return true
  })

  // 6. COMPRIMIR PRA BUDGET
  let runningTokens = 0
  const finalBlocks: Block[] = []
  for (const block of blocks) {
    const blockTokens = estimateTokens(block.content)
    if (runningTokens + blockTokens <= req.budgetTokens) {
      finalBlocks.push(block)
      runningTokens += blockTokens
    }
  }
  const blocksExcluded = blocks.length - finalBlocks.length

  // 7. MONTAR PACKAGE NO FORMATO PEDIDO
  const pkg = buildPackage(finalBlocks, req.format, {
    persona: finalBlocks.find(b => b.type === 'persona'),
    outputTemplate: finalBlocks.find(b => b.type === 'output_template'),
    rules: finalBlocks.filter(b => b.type === 'rule'),
    memories: finalBlocks.filter(b => b.type === 'memory'),
    facts: finalBlocks.filter(b => b.type === 'context_block'),
    knowledge: finalBlocks.filter(b => b.type === 'knowledge'),
    documents: finalBlocks.filter(b => b.type === 'document')
  })

  // 8. REGISTRAR TRACE
  const durationMs = Date.now() - startedAt
  const stats: CompileStats = {
    tokensEstimated: runningTokens,
    blocksConsidered,
    blocksIncluded: finalBlocks.length,
    blocksExcluded,
    warnings
  }
  await persistTrace({
    id: traceId,
    workspaceId: req.workspaceId,
    brainId: brain.id,
    brainVersionId: brain.versionId,
    apiKeyId: req.apiKeyId,
    endpoint: '/v1/context/compile',
    requestPayload: req,
    blocksConsidered,
    blocksIncluded: finalBlocks.length,
    blocksExcluded,
    tokensEstimated: runningTokens,
    warnings,
    statusCode: 200,
    durationMs
  })

  return {
    packageId: generateId('pkg'),
    traceId,
    contextVersion: brain.versionId,
    package: pkg,
    stats
  }
}
```

### 11.1 Cache strategy

```typescript
// Chave de cache: hash(workspace_id + brain_version_id + scope + query + format + budget + apiKey.scopes)
// TTL: 5 minutos
// LRU em Redis: SETEX

const cacheKey = sha256(JSON.stringify({
  wsId: req.workspaceId,
  brainVer: brain.versionId,
  scope: req.scope.sort(),
  query: req.query,
  format: req.format,
  budget: req.budgetTokens,
  scopes: apiKey.scopes.sort()
}))

const cached = await redis.get(`compile:${cacheKey}`)
if (cached) return JSON.parse(cached)

// ... compila ...

await redis.setex(`compile:${cacheKey}`, 300, JSON.stringify(response))
```

---

## 12. Spec RBAC

### 12.1 Geração de API Key

```typescript
function createApiKey(workspaceId: string, name: string, scopes: string[], userId: string) {
  // 1. Gera segredo aleatório
  const secret = crypto.randomBytes(32).toString('base64url')
  const fullKey = `ctx_sk_live_${secret}`
  // 2. Hash com bcrypt
  const keyHash = bcrypt.hashSync(fullKey, 12)
  // 3. Salva no banco
  const apiKey = await db.insert(apiKeys).values({
    workspaceId,
    name,
    keyHash,
    keyPrefix: fullKey.slice(0, 16),  // pra display
    scopes,
    createdBy: userId
  }).returning()
  // 4. Retorna a chave clara só desta vez
  return { id: apiKey[0].id, secret: fullKey }
}
```

### 12.2 Verificação em request

```typescript
async function authenticateApiKey(authHeader: string): Promise<ApiKey> {
  const token = authHeader.replace(/^Bearer\s+/, '')
  if (!token.startsWith('ctx_sk_live_')) throw new Error('invalid_key_format')

  // Lookup por prefix (otimização) — bcrypt é caro
  const prefix = token.slice(0, 16)
  const candidates = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), isNull(apiKeys.revokedAt)))

  for (const candidate of candidates) {
    if (bcrypt.compareSync(token, candidate.keyHash)) {
      // Atualiza last_used + total
      await db.update(apiKeys)
        .set({ lastUsedAt: new Date(), totalRequests: sql`total_requests + 1` })
        .where(eq(apiKeys.id, candidate.id))
      return candidate
    }
  }
  throw new Error('unauthorized')
}
```

### 12.3 Matching de scopes

```typescript
function expandWildcards(scopes: string[]): string[] {
  // Mantém scopes literais + marca wildcards
  return scopes
}

function tagsMatchScopes(blockTags: string[], keyScopes: string[]): boolean {
  // Bloco entra se TODAS as tags do bloco estão cobertas pelos scopes da key
  // Sem tags = considera "public" (acessível com scope "public")
  if (blockTags.length === 0) return keyScopes.includes('public')
  return blockTags.every(tag => keyScopes.some(scope => scopeMatchesTag(scope, tag)))
}

function scopeMatchesTag(scope: string, tag: string): boolean {
  if (scope === tag) return true
  // Wildcard prefix: scope "client:*" cobre tag "client:delta"
  if (scope.endsWith(':*')) {
    const prefix = scope.slice(0, -1)  // "client:"
    return tag.startsWith(prefix)
  }
  return false
}
```

---

## 13. Spec Context Package — schemas

### 13.1 `format=json` (canônico)

```typescript
interface ContextPackageJSON {
  schema_version: 'v1'
  package_id: string
  trace_id: string
  compiled_at: string  // ISO
  context_version: string

  request: {
    workspace_id: string
    brain_id: string
    scope: string[]
    task?: string
    query: string
    consumer?: string
    budget_tokens: number
    format: 'json'
  }

  persona?: { title: string; content: string; source_id: string }
  tone?: { title: string; content: string; source_id: string }
  output_format?: { title: string; content: string; source_id: string }

  instructions: Array<{ title: string; content: string; source_id: string }>
  rules:        Array<{ title: string; content: string; source_id: string }>
  facts:        Array<{ title: string; content: string; source_id: string }>
  memories:     Array<{ title: string; content: string; source_id: string }>
  examples:     Array<{ title: string; content: string; source_id: string }>

  sources: Array<{
    id: string
    title: string
    type: 'document' | 'memory' | 'knowledge'
    ref?: string  // path no storage, se aplicável
  }>

  stats: {
    tokens_estimated: number
    blocks_considered: number
    blocks_included: number
    blocks_excluded: number
    warnings: string[]
  }
}
```

### 13.2 `format=messages` (OpenAI/Anthropic)

```typescript
interface ContextPackageMessages {
  schema_version: 'v1'
  package_id: string
  trace_id: string
  context_version: string

  messages: Array<{
    role: 'system' | 'user'
    content: string
  }>

  stats: { /* idem */ }
  metadata: { /* idem request */ }
}
```

Estrutura típica:
```
[0] system: # Persona\n... # Tom\n... # Formato\n... # Regras\n... # Instruções\n...
[1] system: # Fatos relevantes\n... # Memórias\n... # Exemplos\n...
[2] user:   <query do consumer>
```

### 13.3 `format=markdown`

```typescript
interface ContextPackageMarkdown {
  schema_version: 'v1'
  package_id: string
  trace_id: string
  context_version: string

  markdown: string  // texto único com seções

  stats: { /* idem */ }
}
```

Conteúdo:
```markdown
# Persona
<persona content>

# Tom de voz
<tone content>

# Formato de output
<output_format content>

# Regras
- <rule 1>
- <rule 2>

# Instruções
- <instruction 1>

# Fatos
- <fact 1>
- <fact 2>

# Memórias
- <memory 1>

# Exemplos
<example 1>

# Tarefa
<task ou query>
```

### 13.4 `format=mcp` (MCP response)

```typescript
interface ContextPackageMCP {
  content: Array<{
    type: 'text'
    text: string  // mesmo conteúdo do markdown
  }>
  _meta: {
    package_id: string
    trace_id: string
    stats: { /* idem */ }
  }
}
```

---

## 14. Estrutura de pastas

```
contextos/
├── apps/
│   └── web/                          # Next.js 16 (frontend + API + MCP)
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── signup/
│       │   ├── (app)/
│       │   │   ├── dashboard/
│       │   │   ├── workspaces/[wsId]/
│       │   │   │   ├── projects/[projId]/
│       │   │   │   │   ├── brains/[brainId]/
│       │   │   │   │   │   └── page.tsx       # Canvas Editor
│       │   │   │   │   └── settings/
│       │   │   │   ├── api-keys/             # Tela "Acesso ao Cérebro"
│       │   │   │   ├── memories/
│       │   │   │   └── logs/
│       │   │   └── layout.tsx
│       │   ├── api/
│       │   │   ├── auth/
│       │   │   ├── workspaces/
│       │   │   ├── projects/
│       │   │   ├── brains/
│       │   │   ├── nodes/
│       │   │   ├── edges/
│       │   │   ├── documents/
│       │   │   ├── api-keys/
│       │   │   └── traces/
│       │   ├── v1/                            # API externa (REST pública)
│       │   │   ├── context/
│       │   │   │   ├── retrieve/route.ts
│       │   │   │   └── compile/route.ts
│       │   │   ├── memory/
│       │   │   │   ├── search/route.ts
│       │   │   │   └── create/route.ts
│       │   │   └── brains/route.ts
│       │   └── mcp/route.ts                   # MCP Server endpoint
│       ├── components/
│       │   ├── canvas/                        # React Flow + custom nodes
│       │   ├── nodes/                         # Componentes de cada tipo de nó
│       │   ├── panels/                        # Propriedades, sidebar, etc
│       │   └── ui/                            # shadcn/ui
│       ├── lib/
│       │   ├── auth.ts
│       │   ├── api-client.ts
│       │   └── utils.ts
│       ├── public/
│       ├── styles/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── db/                                    # Drizzle ORM
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── migrations/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── core/                                  # Lógica de domínio (Brain Layer)
│   │   ├── src/
│   │   │   ├── compiler.ts                    # Context Compiler
│   │   │   ├── retriever.ts                   # Retrieve raw context
│   │   │   ├── memory.ts                      # Memory store + search
│   │   │   ├── knowledge.ts                   # Chunking + embeddings
│   │   │   ├── rbac.ts                        # Tag/scope matching
│   │   │   ├── package-builder.ts             # Format adapters (json/messages/md/mcp)
│   │   │   ├── trace.ts                       # Trace persistence
│   │   │   └── types.ts
│   │   └── package.json
│   ├── mcp/                                   # MCP server lib
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── tools.ts
│   │   │   └── transport.ts
│   │   └── package.json
│   └── worker/                                # BullMQ jobs
│       ├── src/
│       │   ├── index.ts
│       │   ├── jobs/
│       │   │   ├── index-document.ts
│       │   │   └── generate-embeddings.ts
│       │   └── queue.ts
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   └── Caddyfile
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── package.json                               # Workspace root (pnpm/bun)
├── pnpm-workspace.yaml
├── turbo.json                                 # Turborepo
├── tsconfig.base.json
├── biome.json                                 # Linter + formatter
├── README.md
├── LICENSE                                    # Apache 2.0
└── docs/
    ├── getting-started.md
    ├── architecture.md
    ├── api-reference.md
    ├── mcp-guide.md
    └── self-hosting.md
```

---

## 15. Docker Compose

### 15.1 `docker-compose.yml` (produção/self-hosted)

```yaml
version: '3.9'

services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    environment:
      DATABASE_URL: postgres://contextos:${POSTGRES_PASSWORD}@postgres:5432/contextos
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${PUBLIC_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      EMBEDDING_PROVIDER: ${EMBEDDING_PROVIDER:-openai}
      STORAGE_DIR: /data/storage
    volumes:
      - storage_data:/data/storage
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
    environment:
      DATABASE_URL: postgres://contextos:${POSTGRES_PASSWORD}@postgres:5432/contextos
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      EMBEDDING_PROVIDER: ${EMBEDDING_PROVIDER:-openai}
      STORAGE_DIR: /data/storage
    volumes:
      - storage_data:/data/storage
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: contextos
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: contextos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U contextos"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  storage_data:
  caddy_data:
  caddy_config:
```

### 15.2 `.env.example`

```bash
# Domínio público (HTTPS automático via Caddy)
PUBLIC_URL=https://meu-cerebro.example.com

# Segredos
POSTGRES_PASSWORD=change_me_long_random
NEXTAUTH_SECRET=change_me_jwt_secret_64_chars

# LLM Providers (pelo menos 1 obrigatório)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Embeddings (default openai com text-embedding-3-small)
EMBEDDING_PROVIDER=openai
```

### 15.3 `docker/Caddyfile`

```caddyfile
{$PUBLIC_URL} {
  reverse_proxy web:3000
}
```

---

## 16. Backlog priorizado (ordem de implementação)

### Sprint 0 — Fundação (3-5 dias)
- [ ] Setup mono-repo (pnpm workspaces + Turborepo + Biome)
- [ ] Setup `packages/db` com Drizzle + migrations iniciais
- [ ] Setup `apps/web` Next.js 16 esqueleto + Tailwind + shadcn
- [ ] docker-compose.yml + Dockerfiles + Caddyfile
- [ ] `docker compose up` sobe tudo vazio sem erro

### Sprint 1 — Auth + Workspace básico (3-4 dias)
- [ ] Schema users + workspaces + projects
- [ ] Endpoints auth (signup, login, logout, me)
- [ ] Páginas login/signup/dashboard
- [ ] CRUD workspaces + projetos (UI + API)
- [ ] Layout app com sidebar de navegação

### Sprint 2 — Canvas básico (5-7 dias)
- [ ] Schema brains + brain_versions + nodes + edges
- [ ] Endpoints CRUD brains, nodes, edges
- [ ] Canvas Editor com React Flow
- [ ] 7 componentes de nó custom (Context, Persona, Rule, Memory, Document, Knowledge, Output Template)
- [ ] Painel lateral de propriedades
- [ ] Auto-save com debounce
- [ ] Snapshot manual + lista de versões

### Sprint 3 — Documents + Knowledge (4-5 dias)
- [ ] Schema documents + knowledge_chunks
- [ ] Endpoint upload multipart
- [ ] Worker BullMQ: extract text (unpdf), chunking, embeddings (OpenAI), persist
- [ ] UI upload + status indexação + visualização de chunks

### Sprint 4 — Memory (2-3 dias)
- [ ] Schema memories
- [ ] Endpoints CRUD memórias + search
- [ ] UI tela de memórias

### Sprint 5 — Context Compiler (5-7 dias)
- [ ] `packages/core/compiler.ts` (pipeline 8 passos)
- [ ] Endpoints `/v1/context/retrieve` + `/v1/context/compile`
- [ ] Format adapters (json, messages, markdown)
- [ ] Cache Redis com hash
- [ ] Schema execution_traces + persistência
- [ ] Tela "Preview" do compiler dentro do Canvas Editor

### Sprint 6 — RBAC + API Keys (3-4 dias)
- [ ] Schema api_keys
- [ ] Endpoints CRUD api_keys
- [ ] Middleware de auth Bearer pra endpoints externos
- [ ] Lógica `tagsMatchScopes` com wildcards
- [ ] Tela "Acesso ao Cérebro"

### Sprint 7 — MCP Server (4-5 dias)
- [ ] `packages/mcp` server lib
- [ ] Endpoint `/mcp` com JSON-RPC
- [ ] 5 tools (retrieve_context, compile_context, search_memory, save_memory, list_brains)
- [ ] Format adapter `mcp`
- [ ] Doc de config Claude Desktop

### Sprint 8 — Trace UI + Polish (3-4 dias)
- [ ] Tela de logs com filtros + drill-down
- [ ] Export CSV
- [ ] Tela "Testar" com 1 provedor configurável
- [ ] Onboarding + getting-started.md
- [ ] README com docker compose up demo

### Sprint 9 — Hardening + docs (3-5 dias)
- [ ] Rate limiting por API key
- [ ] Health endpoint
- [ ] Backup automático Postgres
- [ ] Docs: architecture, api-reference, mcp-guide, self-hosting
- [ ] LICENSE Apache 2.0
- [ ] CI básico (lint, type-check, build)

**Total estimado:** 35-50 dias de trabalho focado (dev solo + IA). Calendário: 7-10 semanas considerando contexto/interrupções.

---

## 17. Critérios de aceite (DoD por feature)

### Feature: Auth
- [ ] Signup/login/logout funcionam end-to-end
- [ ] Senha hashed bcrypt
- [ ] JWT em cookie httpOnly, secure em prod
- [ ] Tentativa de acesso sem auth retorna 401
- [ ] Teste manual: signup → login → acessa dashboard → logout → não acessa mais

### Feature: Workspace/Projeto/Cérebro
- [ ] CRUD completo via UI
- [ ] Slugs únicos validados
- [ ] Cascade delete (workspace → projects → brains)
- [ ] User só vê seus próprios workspaces

### Feature: Canvas
- [ ] Arrastar nó do painel cria nó no canvas
- [ ] Click em nó abre painel de propriedades
- [ ] Edit propriedades persiste (auto-save 2s debounce)
- [ ] Edge entre 2 nós persiste
- [ ] Refresh da página mantém estado
- [ ] Snapshot manual cria versão imutável visível na lista

### Feature: Documents
- [ ] Upload PDF/MD/TXT funciona (até 25MB)
- [ ] Worker processa em background, status muda indexing → ready
- [ ] Chunks viram nós Knowledge no canvas
- [ ] Delete remove embeddings

### Feature: Context Compiler
- [ ] `/v1/context/compile` retorna package no formato pedido
- [ ] p95 < 500ms pra budget 8k em workspace com 100 blocos
- [ ] Trace gravado em `execution_traces`
- [ ] Cache hit em request repetida (< 50ms)
- [ ] Warnings de conflito aparecem corretamente

### Feature: RBAC
- [ ] Criar API key retorna chave 1x apenas
- [ ] Key revogada retorna 401
- [ ] Scope `client:*` cobre `client:delta`
- [ ] Bloco com tag `confidential` não retorna pra key sem scope `confidential`
- [ ] Default-deny: key sem scopes só vê tag `public`

### Feature: MCP Server
- [ ] Claude Desktop configurado consegue listar tools
- [ ] `compile_context` retorna texto utilizável
- [ ] Auth Bearer funciona
- [ ] Tool errors retornam estrutura MCP padrão

### Feature: Tela Acesso ao Cérebro
- [ ] Lista keys, cria, edita scopes, revoga
- [ ] Logs últimas 24h aparecem em tempo real
- [ ] Export CSV funciona
- [ ] Filtros funcionam

---

## 18. Riscos e mitigações

### R1: Context Compiler ficar lento com canvas grande
- **Risco**: 1000+ blocos = embedding similarity em todos = lento
- **Mitigação**: Pré-indexar embeddings em pgvector (HNSW), filtrar por escopo ANTES de calcular similarity, paralelizar com workers

### R2: MCP SDK ainda novo, mudanças breaking
- **Risco**: `@modelcontextprotocol/sdk` evoluindo rápido em 2026
- **Mitigação**: Pin de versão, testes de integração com Claude Desktop, abstrair o MCP behind interface

### R3: Worker BullMQ travar e bloquear indexação
- **Risco**: Job de embedding falha silenciosamente
- **Mitigação**: Retry 3x + DLQ + alerta visível na UI

### R4: Dev solo + escopo grande = burnout
- **Risco**: 50 dias de execução focada é otimista
- **Mitigação**: Sprint 8-9 são opcionais pra primeiro lançamento; lançar com 6 sprints é viável

### R5: pgvector vs Postgres na mesma instância
- **Risco**: Embeddings consomem RAM, podem afetar queries OLTP
- **Mitigação**: Configurar pgvector com `maintenance_work_mem` adequado; separar em fase 2 se virar dor

### R6: Custos de embeddings em escala
- **Risco**: 1 cliente upa 1k PDFs = milhares de chamadas pra OpenAI
- **Mitigação**: Rate limit por workspace, configurar provedor local (Ollama) opcional fase 2

### R7: RBAC tag-based pode virar bagunça
- **Risco**: User cria 50 tags inconsistentes, perde controle
- **Mitigação**: Autocomplete de tags existentes; sugestão de namespace (`area:`, `client:`, `sensitivity:`)

### R8: Briefing fala "self-hosted" mas dev solo precisa demo pública
- **Risco**: Sem demo, ninguém testa
- **Mitigação**: Subir 1 instância pública em VPS Hetzner/Railway só pra demo (não vira produto SaaS); README aponta pra ela

### R9: Próximos LLMs podem suprimir necessidade de "contexto manual"
- **Risco**: Claude 5 com 10M context window resolve por capacidade bruta
- **Mitigação**: Tese de governança/rastreabilidade/multi-IA não é resolvida por context window — diferencial sobrevive

### R10: Open source sem comunidade = projeto morto
- **Risco**: Lançar e ninguém usar
- **Mitigação**: Lançamento coordenado (HN + Twitter + comunidades AI), docs caprichadas, video demo, primeiros 10 usuários cultivados manualmente

---

## 19. Próximas decisões pós-MVP

Quando MVP estiver no ar e tiver feedback real:

1. **Sumarização LLM** no Compiler (para budgets apertados)
2. **Conflict-judge LLM** para detecção semântica de conflitos
3. **Agentes executáveis** + tools (volta nodes Tool, Agent, Router, Validator)
4. **Integrações via API genérica** (Drive, Notion, n8n)
5. **OpenAPI Actions** para Custom GPTs
6. **SDK oficial** TS e Python
7. **Diff visual** de versões
8. **Multi-tenant formal** + plano Studio (ICP B)
9. **Templates marketplace** público
10. **Cloud hospedado** (oferta managed)
11. **SSO/SAML** + audit log enterprise
12. **Ollama local** como provedor de embeddings + LLM

---

## 20. Anexos

### 20.1 Glossário

| Termo | Definição |
|---|---|
| **Cérebro** | Instância de Canvas com nodes + edges representando um sistema contextual |
| **Bloco** / **Nó** | Unidade atômica de contexto (Persona, Rule, Memory, etc) |
| **Escopo** | Dimensão hierárquica (workspace, projeto, cliente, etc) — filtro de quais blocos aplicam |
| **Prioridade** | Peso numérico (30-100) que ordena blocos na compilação |
| **Tag** | Label arbitrária em bloco usada para RBAC (`public`, `commercial`, `client:delta`) |
| **Scope (RBAC)** | Lista de tags permitidas numa API Key |
| **Context Package** | Output do Compiler — pronto pra IA consumir |
| **Trace** | Registro imutável de toda consulta API (auditoria + debug) |
| **Snapshot** | Versão imutável de um cérebro |
| **Consumer** | IA/app/agente que pluga no cérebro via API/MCP |

### 20.2 Decisões registradas (sumário)

Todas as decisões deste PRD foram tomadas em **2026-05-23** em conversa colaborativa. Registradas em memory pessoal:
- `~/.claude/projects/-Users-juliocarvalho-APIs-ContextOS/memory/contextos-projeto.md`

---

**FIM DO PRD v0.1**

Próximo artefato: scaffold inicial do repo (estrutura de pastas + docker-compose + boilerplate). Cobertura da task #16.
