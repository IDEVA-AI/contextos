# Self-hosting

ContextOS é open-source sob Apache 2.0, projetado pra rodar **na sua máquina** ou no **seu servidor**. Nenhum dado sai daí.

## Setup local (dev)

Pré-requisitos: Node ≥20, pnpm 10, Docker, git.

```bash
git clone https://github.com/IDEVA-AI/contextos.git
cd contextos
pnpm infra:up                # Postgres+pgvector + Redis
pnpm install
cp .env.example .env.local
# edita .env.local (pelo menos NEXTAUTH_SECRET; ANTHROPIC/OPENAI_API_KEY opcional)
ln -sf ../../.env.local apps/web/.env.local
pnpm db:push
pnpm dev                     # http://localhost:3000
# em outro terminal:
pnpm --filter @contextos/worker dev   # processa indexação
```

## Setup self-hosted (produção)

Use `docker-compose.prod.yml`:

```bash
# 1. Configurar env
cp .env.example .env
# edita PUBLIC_URL=https://contextos.suaempresa.com
# define POSTGRES_PASSWORD forte
# define NEXTAUTH_SECRET (64 chars random)

# 2. Subir stack completa
docker compose -f docker-compose.prod.yml up -d

# 3. Aplicar schema na primeira vez
docker compose -f docker-compose.prod.yml exec web pnpm db:push

# 4. Acessar via Caddy (HTTPS automático)
open $PUBLIC_URL
```

A stack inclui: Caddy (HTTPS automático), Next.js (web), worker BullMQ, Postgres+pgvector, Redis.

## Variáveis de ambiente

| Var | Obrigatório | Default | |
|---|---|---|---|
| `DATABASE_URL` | sim | — | `postgres://contextos:senha@host:5432/contextos` |
| `REDIS_URL` | sim | — | `redis://host:6379` |
| `NEXTAUTH_SECRET` | sim | — | ≥32 chars random |
| `NEXTAUTH_URL` | sim | — | URL pública |
| `STORAGE_DIR` | sim | — | **caminho absoluto** (gotcha — relativo quebra em mono-repo) |
| `ANTHROPIC_API_KEY` | não | — | habilita botão "Testar com IA" |
| `OPENAI_API_KEY` | não | — | embeddings + botão Testar fallback |
| `EMBEDDING_PROVIDER` | não | `openai` | `none` desliga embedding (chunks salvos sem vector) |
| `EMBEDDING_MODEL` | não | `text-embedding-3-small` | |
| `LOG_LEVEL` | não | `info` | pino levels |
| `NODE_ENV` | não | `development` | `production` ativa cookies secure |

## Backup

`docker/backup-postgres.sh` faz pg_dump comprimido com retenção configurável.

Crontab exemplo (rodar diário às 3h):
```cron
0 3 * * * /opt/contextos/docker/backup-postgres.sh /backups/contextos >> /var/log/contextos-backup.log 2>&1
```

Variáveis (override no cron ou no script):
- `POSTGRES_CONTAINER` (default `contextos_postgres`)
- `POSTGRES_DB`, `POSTGRES_USER`
- `RETENTION_DAYS` (default 7)

## Storage de arquivos

MVP usa filesystem local (`STORAGE_DIR`). Pra migrar pra MinIO/S3 no futuro: implementar `StorageInterface` em `packages/core/storage.ts` e swap o factory `getStorage()`.

## Logs

Pino structured logs em JSON pra stdout. Em produção, pipe pro seu agregador (Loki, Datadog, etc):

```bash
docker compose logs web | pino-pretty   # leitura humano
```

## Health check

```bash
curl https://seu-host/health
# { "status": "ok", "checks": { "db": {...}, "redis": {...} } }
```

Liveness probe Kubernetes:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  periodSeconds: 30
```

## Scaling

MVP escala vertical até 50k req/dia em 2vCPU/4GB. Pra mais:

- **Postgres**: separa em instância dedicada, ajusta `maintenance_work_mem` pra HNSW
- **Redis**: gerenciado (Upstash, ElastiCache) — single-node basta até ~10k QPS
- **Web**: replicas atrás de Caddy/nginx; sessions são JWT stateless
- **Worker**: aumenta `concurrency` ou roda multiple instâncias (BullMQ distribui)
- **Storage**: troca filesystem por S3/MinIO

## Segurança

- Bcrypt cost 12 (passwords + API keys)
- JWT HS256 com TTL 7d
- httpOnly + Secure (prod) + sameSite=lax cookies
- API keys com prefix lookup pra evitar bcrypt full table scan
- Default-deny RBAC quando Bearer
- SQL via Drizzle (sem string concat)
- CORS configurável (default allow-all em self-hosted)
- Rate limit 100 req/min por key (token bucket Redis)

Recomendações extra:
- Coloca Caddy/Cloudflare na frente pra TLS + WAF
- Rotaciona `NEXTAUTH_SECRET` periodicamente
- Backup off-site
- Não exponha Postgres/Redis na internet (só via container network)

## Troubleshooting

### Tela branca no dev
Lockfile no `$HOME` confunde Turbopack root. `next.config.ts` pina `turbopack.root` + `outputFileTracingRoot`. Verifica.

### Storage error "file not found" no worker
`STORAGE_DIR` deve ser caminho **absoluto**. Relativo resolve diferente em `apps/web` vs `packages/worker` (cwd distinto).

### `next dev` reclama de "multiple lockfiles"
Adicionar `outputFileTracingRoot: monorepoRoot` em `next.config.ts`.

### Worker não pega jobs
- `pnpm --filter @contextos/worker dev` rodando?
- REDIS_URL apontando pro mesmo Redis que o web?
- `EMBEDDING_PROVIDER=none` quando sem OpenAI key (senão job falha com 401)

### Postgres porta ocupada
Outro Postgres já rodando local? `lsof -i :5432`. Mudar porta no `docker-compose.yml`.

### Embeddings vazios
`OPENAI_API_KEY` não setada → modo offline (chunks salvos sem embedding). Search cai pra ILIKE textual. Funciona, mas menos preciso.

---

[← README](../README.md) · [Architecture](./architecture.md) · [API Reference](./api-reference.md) · [MCP Guide](./mcp-guide.md)
