# Deploy ContextOS no servidor IDEVA

Guia passo-a-passo pra subir o ContextOS no servidor Hetzner (Docker Swarm + Traefik + Cloudflare tunnel). Padrão alinhado com InstaPost e outras stacks do ecossistema IDEVA-AI.

---

## Visão geral da arquitetura

```
Internet
  ↓
Cloudflare (SSL/DDoS, conta Auriuscorp@gmail.com)
  ↓ tunnel "clickup"
Traefik :80 (infra_traefik)
  ↓ Host(contextos.onexos.com.br)
contextos_web (Next.js standalone, :3000)
  ├──→ infra_postgres (database: contextos, role: contextos, pgvector)
  ├──→ contextos_redis (BullMQ + cache + rate limit)
  └──→ /data/storage (volume bind: /mnt/HC_Volume_105094036/contextos/storage)

contextos_worker (BullMQ consumer)
  ├──→ infra_postgres
  ├──→ contextos_redis
  └──→ /data/storage
```

3 serviços no stack `contextos`: `web`, `worker`, `redis`. Database reusa `infra_postgres` compartilhado.

---

## Pré-requisitos

- SSH `root@178.156.252.78` funcionando
- Docker buildx local (build linux/amd64)
- Domínio `contextos.onexos.com.br` resolvendo pro Cloudflare tunnel "clickup" (DNS proxied)
- Acesso ao painel Cloudflare (conta Auriuscorp@gmail.com) pra criar o CNAME

---

## Passo 0 — DNS no Cloudflare

1. Login no Cloudflare → zona `onexos.com.br`
2. **DNS → Records → Add record**
   - Type: `CNAME`
   - Name: `contextos`
   - Target: `<tunnel-uuid>.cfargotunnel.com` (mesmo que outros subdomínios `*.onexos.com.br` usam — copia do `nexo` ou `instapost`)
   - Proxy: **Proxied** (laranja)
3. Verifica via: `dig contextos.onexos.com.br +short` (deve retornar IPs Cloudflare)

> Se DNS não propagou em 5min, faz log via `nslookup contextos.onexos.com.br 1.1.1.1`.

---

## Passo 1 — Criar database no infra_postgres

```bash
# 1.1 Gera senha forte
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
echo "Senha gerada: $DB_PASSWORD"
# Anota essa senha! Vai pra .env.stack no passo 3.

# 1.2 Edita scripts/setup-database.sql trocando o placeholder pela senha real
# OU usa psql com --variable (mais limpo):

ssh root@178.156.252.78 "docker exec -i \$(docker ps -qf name=infra_postgres) \
  psql -U postgres -v contextos_password=\"'$DB_PASSWORD'\"" \
  < scripts/setup-database.sql
```

Saída esperada:
```
CREATE ROLE
CREATE DATABASE
CREATE EXTENSION
GRANT
...
ContextOS database setup OK.
```

---

## Passo 2 — Adicionar ao backup automático

```bash
ssh root@178.156.252.78
nano /home/deploy/backup-postgres.sh
# Adiciona "contextos" no array DBS:
#   DBS="clickup evolution nexo magicsite sitefy index2pub deploybridge nxvoice valloure contextos"
# Salva, sai.

# Smoke test do backup
bash /home/deploy/backup-postgres.sh
ls /mnt/HC_Volume_105094036/backups/postgres/ | grep contextos
```

---

## Passo 3 — Aplicar schema (drizzle push remoto)

```bash
# Local — pnpm filter db push contra DB remoto
# Atenção: precisa que infra_postgres :5432 esteja acessível externamente,
# OU rodar dentro de um container conectado à network_public.
# Default do servidor: NÃO expõe 5432 externamente (UFW só SSH).
#
# Opção A: tunel SSH temporário
ssh -L 5432:172.18.0.X:5432 root@178.156.252.78 -N &
# (Pega o IP de infra_postgres na network com:
#  ssh root@178.156.252.78 "docker inspect infra_postgres --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")

DATABASE_URL=postgresql://contextos:SENHA@localhost:5432/contextos \
  pnpm --filter @contextos/db push

# Opção B: rodar drizzle-kit dentro de container temporário no servidor (recomendado)
ssh root@178.156.252.78
docker run --rm -it \
  --network network_public \
  -e DATABASE_URL=postgresql://contextos:SENHA@infra_postgres:5432/contextos \
  -v /root/projetos/contextos:/app \
  -w /app \
  node:20-alpine sh -c "corepack enable && pnpm install --filter @contextos/db && pnpm --filter @contextos/db push --force"
```

> Mais fácil: a primeira vez transfere o repo inteiro pro servidor (`/root/projetos/contextos/`) e roda push lá. Depois só CI/scripts.

Confirma:
```bash
ssh root@178.156.252.78 "docker exec -it \$(docker ps -qf name=infra_postgres) \
  psql -U contextos -d contextos -c '\dt'"
```

Deve listar 12 tabelas: users, sessions, workspaces, projects, brains, brain_versions, brain_nodes, brain_edges, memories, documents, knowledge_chunks, api_keys, execution_traces.

---

## Passo 4 — Preparar diretório de storage

```bash
ssh root@178.156.252.78
mkdir -p /mnt/HC_Volume_105094036/contextos/storage
chmod 755 /mnt/HC_Volume_105094036/contextos/storage
```

---

## Passo 5 — Configurar .env.stack no servidor

```bash
# Local
cp .env.stack.example /tmp/.env.stack
nano /tmp/.env.stack
# Preenche:
#   CONTEXTOS_DB_PASSWORD=<senha-do-passo-1>
#   CONTEXTOS_SESSION_SECRET=$(openssl rand -base64 48)
#   OPENAI_API_KEY=sk-... (opcional)

# Transfere
ssh root@178.156.252.78 "mkdir -p /home/deploy/apps/contextos"
scp /tmp/.env.stack root@178.156.252.78:/home/deploy/apps/contextos/.env.stack
ssh root@178.156.252.78 "chmod 600 /home/deploy/apps/contextos/.env.stack"
rm /tmp/.env.stack  # cleanup local
```

---

## Passo 6 — Deploy

```bash
# Da raiz do repo, na sua máquina:
./scripts/deploy-ideva.sh
```

O script:
1. Build local `contextos-web:latest` e `contextos-worker:latest` (linux/amd64 via buildx)
2. `docker save | gzip | ssh ... 'gunzip | docker load'` — transfere as imagens
3. `scp docker-stack.yaml` pro servidor
4. `docker stack deploy -c docker-stack.yaml --with-registry-auth contextos`

Saída esperada:
```
✓ Deploy concluído. Verificando serviços...
ID    NAME              MODE        REPLICAS  IMAGE
xxxx  contextos_redis   replicated  1/1       redis:7-alpine
xxxx  contextos_web     replicated  1/1       contextos-web:latest
xxxx  contextos_worker  replicated  1/1       contextos-worker:latest
```

---

## Passo 7 — Smoke test

```bash
# Health
curl https://contextos.onexos.com.br/health
# → {"status":"ok","db":{"ok":true,...},"redis":{"ok":true,...}}

# Signup público (cria primeiro user)
curl -X POST https://contextos.onexos.com.br/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@ideva-ai.com","password":"<senha-forte>"}'

# Login + sessão
curl -c /tmp/c.txt -X POST https://contextos.onexos.com.br/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@ideva-ai.com","password":"<senha>"}'

# Workspace
curl -b /tmp/c.txt -X POST https://contextos.onexos.com.br/api/workspaces \
  -H 'Content-Type: application/json' \
  -d '{"name":"IDEVA-AI","slug":"ideva-ai"}'

# Acessa UI
open https://contextos.onexos.com.br/login
```

---

## Passo 8 — Plugar Claude Desktop

1. UI → workspace → **Acesso ao cérebro** → criar key com scopes `["*"]` (admin) e/ou `["public"]` (uso externo)
2. Edita `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "contextos-prod": {
         "transport": {
           "type": "streamable-http",
           "url": "https://contextos.onexos.com.br/mcp",
           "headers": {
             "Authorization": "Bearer ctx_sk_live_xxx"
           }
         }
       }
     }
   }
   ```
3. Restart Claude Desktop. No chat: "Liste cérebros do workspace IDEVA-AI."

---

## Operação contínua

### Ver logs

```bash
ssh root@178.156.252.78 "docker service logs -f contextos_web --tail 100"
ssh root@178.156.252.78 "docker service logs -f contextos_worker --tail 100"
```

### Update — code change

```bash
./scripts/deploy-ideva.sh
# Swarm faz rolling update sem downtime
```

### Update — só env

```bash
ssh root@178.156.252.78 "nano /home/deploy/apps/contextos/.env.stack"
ssh root@178.156.252.78 "cd /home/deploy/apps/contextos && set -a && source .env.stack && set +a && docker stack deploy -c docker-stack.yaml contextos"
```

### Backup manual

```bash
ssh root@178.156.252.78 "docker exec \$(docker ps -qf name=infra_postgres) \
  pg_dump -U contextos contextos | gzip > /tmp/contextos_manual_$(date +%F).sql.gz"
```

### Restore

```bash
# Cuidado — destrutivo!
ssh root@178.156.252.78
gunzip -c /mnt/HC_Volume_105094036/backups/postgres/contextos_2026-05-23.sql.gz | \
  docker exec -i $(docker ps -qf name=infra_postgres) psql -U contextos -d contextos
```

### Rollback de imagem

```bash
# Tagueia versão antes do deploy: docker tag contextos-web:latest contextos-web:v0.1.0
# Pra reverter:
ssh root@178.156.252.78 "docker service update --image contextos-web:v0.1.0 contextos_web"
```

---

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| `502 Bad Gateway` no `/` | Container web não subiu | `docker service ps contextos_web` mostra `Failed` — ver logs |
| `DATABASE_URL is required` | `.env.stack` não foi sourced | Refaz deploy com `set -a; source .env.stack; set +a` antes de `stack deploy` |
| `connection refused` redis | `contextos_redis` ainda startando | Aguarda 10s, refaz curl |
| Worker não pega job | REDIS_URL diferente entre web e worker | Confirma ambos usando `redis://contextos_redis:6379` |
| Upload de doc falha 500 | `/data/storage` sem permissão | `ssh ... chmod 777 /mnt/HC_Volume_105094036/contextos/storage` |
| `/health` retorna `db.ok=false` | Senha errada em `.env.stack` ou DB não criado | Confere passo 1 + 5 |
| Cloudflare 522 | Traefik não tem label correto | Confere `docker service inspect contextos_web` — labels devem ter `traefik.enable=true` |
| MCP /mcp body vazio | Cliente fechou stream antes de ler | Reduz timeouts agressivos do cliente |

---

## Custos estimados

| Item | Custo/mês |
|---|---|
| Hetzner CPX21 (já existe, compartilhado) | R$ 0 marginal |
| Hetzner Volume 50GB (já existe, compartilhado) | R$ 0 marginal |
| Cloudflare (free plan) | R$ 0 |
| OpenAI embeddings (opcional, ~$0.02 / 1M tokens) | R$ 0-50 dependendo de volume |
| **Total marginal** | **~R$ 0-50/mês** |

Servidor IDEVA é compartilhado entre vários projetos. ContextOS adiciona footprint pequeno (Next.js standalone ~100MB RAM em idle, BullMQ worker ~80MB).
