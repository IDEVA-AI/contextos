# Getting Started — ContextOS

Setup pra rodar localmente em < 10 minutos.

## Pré-requisitos

- Node ≥ 20 (recomendado 20.20.0 via [nvm](https://github.com/nvm-sh/nvm))
- pnpm 10+
- Docker + Docker Compose
- git
- Chave de API: **OpenAI** (pra embeddings) ou **Anthropic** (pra LLM)

## Setup

### 1. Clone o repo

```bash
git clone https://github.com/IDEVA-AI/contextos.git
cd contextos
```

### 2. Subir Postgres + Redis (Docker)

```bash
pnpm infra:up
```

Isso sobe:
- `contextos_postgres` em `localhost:5432` (user/pwd/db: `contextos`/`contextos_dev`/`contextos`)
- `contextos_redis` em `localhost:6379`

Verifica:
```bash
docker ps | grep contextos_
```

### 3. Instalar dependências

```bash
pnpm install
```

### 4. Configurar env

```bash
cp .env.example .env.local
```

Edita `.env.local` e preenche pelo menos um:
```
OPENAI_API_KEY=sk-xxx       # pra embeddings (recomendado)
ANTHROPIC_API_KEY=sk-ant-xxx # pra LLM (opcional no MVP — só botão Testar)
```

### 5. Rodar migrations

```bash
pnpm db:push
```

> Quando schema estabilizar, mudar pra `pnpm db:generate` + `pnpm db:migrate` (migrations versionadas).

### 6. Subir dev

```bash
pnpm dev
```

Abre http://localhost:3000

## Comandos úteis

```bash
# Infra
pnpm infra:up         # sobe Postgres + Redis
pnpm infra:down       # para tudo
pnpm infra:logs       # tail logs

# Database
pnpm db:push          # aplica schema (dev rápido)
pnpm db:generate      # gera migration
pnpm db:migrate       # roda migrations
pnpm db:studio        # abre Drizzle Studio

# Dev
pnpm dev              # tudo via turbo
pnpm build            # build tudo
pnpm lint             # biome
pnpm format           # biome --write
pnpm type-check       # tsc --noEmit em tudo
```

## Estrutura do mono-repo

```
contextos/
├── apps/web/         # Next.js 16 (frontend + API + MCP server)
├── packages/
│   ├── db/           # Drizzle schema + migrations
│   ├── core/         # Context Compiler + lógica de domínio (Sprint 5)
│   ├── mcp/          # MCP server (Sprint 7)
│   └── worker/       # BullMQ jobs de indexação (Sprint 3)
├── docker/           # Dockerfiles + Caddyfile
└── docker-compose.yml  # Dev infra
```

## Próximos passos

Ver [PRD §16](../PRD_v0.1.md#16-backlog-priorizado-ordem-de-implementação) para o backlog por sprint.

## Troubleshooting

### `pnpm infra:up` falha
- Docker rodando? `docker ps`
- Porta 5432 ou 6379 já em uso? `lsof -i :5432`

### `pnpm db:push` falha
- Postgres saudável? `docker exec contextos_postgres pg_isready -U contextos`
- `DATABASE_URL` correto no `.env.local`?
- Extensão `vector` está habilitada? (próxima migration cuida — por ora rodar manualmente: `docker exec contextos_postgres psql -U contextos -c 'CREATE EXTENSION IF NOT EXISTS vector;'`)

### `pnpm dev` quebra
- `pnpm install` rodou? (algum package faltando?)
- Node ≥ 20? `node -v`
- Variável de ambiente faltando? Veja `.env.example`
