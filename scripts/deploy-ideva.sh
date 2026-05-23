#!/usr/bin/env bash
# ContextOS — Deploy pro servidor IDEVA (Hetzner, Docker Swarm).
#
# Padrão alinhado com InstaPost: build local + docker save + scp + docker load + stack deploy.
# Não usa registry — transfere imagens via SSH direto.
#
# Pré-requisitos no SERVIDOR (1x, manual):
#   1. Role/database criado: psql -U postgres -h infra_postgres -f scripts/setup-database.sql
#   2. /home/deploy/apps/contextos/.env.stack preenchido (copia de .env.stack.example)
#   3. /home/deploy/apps/contextos/docker-stack.yaml presente (copiado via este script)
#   4. Diretório de storage criado: mkdir -p /mnt/HC_Volume_105094036/contextos/storage
#   5. DNS contextos.onexos.com.br apontando pro Cloudflare tunnel
#
# Uso:
#   ./scripts/deploy-ideva.sh
#
# Variáveis opcionais:
#   SSH_HOST       (default: root@178.156.252.78)
#   REMOTE_DIR     (default: /home/deploy/apps/contextos)
#   STACK_NAME     (default: contextos)
#   SKIP_BUILD     (set=1 pra pular build, deploy só)

set -euo pipefail

SSH_HOST="${SSH_HOST:-root@178.156.252.78}"
REMOTE_DIR="${REMOTE_DIR:-/home/deploy/apps/contextos}"
STACK_NAME="${STACK_NAME:-contextos}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "→ Working dir: $ROOT_DIR"
echo "→ Target host: $SSH_HOST"
echo "→ Remote dir:  $REMOTE_DIR"
echo "→ Stack name:  $STACK_NAME"
echo

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "==> 1/4 Build local das imagens (linux/amd64)"
  docker buildx build \
    --platform linux/amd64 \
    -f docker/Dockerfile.web \
    -t contextos-web:latest \
    --load \
    .

  docker buildx build \
    --platform linux/amd64 \
    -f docker/Dockerfile.worker \
    -t contextos-worker:latest \
    --load \
    .
else
  echo "==> 1/4 SKIP_BUILD=1 — pulando build"
fi

echo
echo "==> 2/4 Save + transfer das imagens"
docker save contextos-web:latest contextos-worker:latest | \
  gzip --fast | \
  ssh "$SSH_HOST" "gunzip | docker load"

echo
echo "==> 3/4 Transferir docker-stack.yaml"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
scp docker-stack.yaml "$SSH_HOST:$REMOTE_DIR/docker-stack.yaml"

echo
echo "==> 4/4 Deploy do stack"
ssh "$SSH_HOST" "cd $REMOTE_DIR && set -a && source .env.stack && set +a && docker stack deploy -c docker-stack.yaml $STACK_NAME --with-registry-auth"

echo
echo "✓ Deploy concluído. Verificando serviços..."
ssh "$SSH_HOST" "docker service ls --filter label=com.docker.stack.namespace=$STACK_NAME"

echo
echo "Smoke test: curl https://contextos.onexos.com.br/health"
echo "Logs:       ssh $SSH_HOST 'docker service logs -f ${STACK_NAME}_web'"
