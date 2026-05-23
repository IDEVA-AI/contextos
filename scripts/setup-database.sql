-- ContextOS — Setup inicial do banco no infra_postgres compartilhado.
--
-- Rodar UMA VEZ no servidor como usuário postgres do container infra_postgres:
--
--   ssh root@178.156.252.78 'docker exec -i $(docker ps -qf name=infra_postgres) \
--     psql -U postgres -v contextos_password="$(openssl rand -base64 24)"' < scripts/setup-database.sql
--
-- (ou copia o arquivo pro servidor e roda lá com a senha desejada via psql --variable)
--
-- Depois:
--   1. Anota a senha gerada em .env.stack como CONTEXTOS_DB_PASSWORD
--   2. Adiciona "contextos" no array DBS de /home/deploy/backup-postgres.sh
--   3. Roda drizzle-kit push local apontando pra DATABASE_URL=postgresql://contextos:SENHA@178.156.252.78:5432/contextos
--      OU exec dentro de container web depois do deploy: docker exec -it contextos_web ... (depende do setup)

-- Cria role com password parametrizado
\set contextos_password '''contextos_change_me_in_production'''

CREATE ROLE contextos WITH LOGIN PASSWORD :contextos_password;

-- Cria database
CREATE DATABASE contextos OWNER contextos;

-- Conecta no DB pra habilitar extensão pgvector
\c contextos

-- pgvector já está disponível na imagem pgvector/pgvector:pg16
CREATE EXTENSION IF NOT EXISTS vector;

-- Grants explícitos (defensivo)
GRANT ALL PRIVILEGES ON DATABASE contextos TO contextos;
GRANT ALL ON SCHEMA public TO contextos;

\echo 'ContextOS database setup OK. Próximos passos:'
\echo '  1. Atualiza CONTEXTOS_DB_PASSWORD em .env.stack'
\echo '  2. Adiciona "contextos" no array DBS de /home/deploy/backup-postgres.sh'
\echo '  3. Roda drizzle-kit push pra criar as 12 tabelas:'
\echo '     DATABASE_URL=postgresql://contextos:SENHA@178.156.252.78:5432/contextos pnpm --filter @contextos/db push'
