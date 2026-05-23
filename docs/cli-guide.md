# CLI Guide — `@contextos/cli`

Terminal client oficial. Útil pra dev solo, CI pipelines, e quem prefere terminal sobre UI.

## Install

Build do mono-repo:

```bash
pnpm --filter @contextos/cli build
node packages/cli/dist/index.js --help
```

Symlink global (opcional):

```bash
pnpm --filter @contextos/cli link --global
contextos --help
```

> Requer Node 20+ (usa fetch global, FormData global, File global).

---

## Autenticação

### Interactive login

```bash
contextos auth login
```

Prompts: nome do perfil, URL do servidor, API key. Valida contra `/v1/brains` antes de salvar.

Profiles ficam em `~/.contextos/config.json` (chmod 600).

### Non-interactive (CI / scripts)

```bash
contextos auth login --name ci --url https://contextos.exemplo.com --key ctx_sk_live_...
```

### Via env (sem profile salvo)

```bash
export CONTEXTOS_URL=http://localhost:3000
export CONTEXTOS_API_KEY=ctx_sk_live_...
export CONTEXTOS_WORKSPACE_ID=659b2fed-...  # opcional, simplifica -w
```

Quando `CONTEXTOS_URL` e `CONTEXTOS_API_KEY` estão setados, o CLI usa o perfil virtual `env` e ignora `~/.contextos/config.json`.

### Trocar perfil

```bash
contextos brains list -w $WS -p ci
# ou
export CONTEXTOS_PROFILE=ci
```

---

## Comandos

### Brains

```bash
contextos brains list -w <workspace_id>
contextos brains list -w <ws> --json | jq '.brains[] | {id, name}'
```

### Compile

Compila pacote de contexto pronto pra alimentar LLM.

```bash
contextos compile <brainId> -w <ws> -q "preciso responder lead pedindo proposta"

# Format messages (OpenAI/Anthropic)
contextos compile <brainId> -w <ws> -q "..." --format messages

# Com task + budget + escopo
contextos compile <brainId> -w <ws> -q "..." \
  --task "responder lead frio" \
  --format markdown \
  --budget 4000 \
  --scope public --scope commercial

# JSON cru
contextos compile <brainId> -w <ws> -q "..." --json
```

| Flag | Default | Quando usar |
|---|---|---|
| `--format <fmt>` | `markdown` | `messages` pra OpenAI/Anthropic, `json` pra parser custom, `mcp` pra cliente MCP |
| `--budget <tokens>` | server (8000) | Limita tamanho do pacote |
| `--scope <tag...>` | (vazio) | Filtra blocos por tag de escopo (multivalor) |
| `--task <text>` | — | Descreve tarefa no contexto (vai no campo `task`) |

### Retrieve

Lista blocos rankeados **sem** montar pacote (raw debugging).

```bash
contextos retrieve <brainId> -w <ws> -q "tom de voz"
contextos retrieve <brainId> -w <ws> -q "..." --top-k 20 --json
```

### Memory

```bash
# Criar
contextos memory create -w <ws> --scope-type workspace --scope-id <ws> \
  --title "ICP" --content "Cliente B2B dev solo" --tags voice --tags icp

# Stdin (paste / pipe)
echo "Lembrar de citar caso Funil365 em propostas comerciais" | \
  contextos memory create -w <ws> --scope-type workspace --scope-id <ws> --title "Cases"

# Buscar
contextos memory search -w <ws> --scope-type workspace --scope-id <ws> -q "tom"
contextos memory search -w <ws> --scope-type projeto --scope-id <proj_id> -q "..." --limit 5
```

Scope types: `workspace`, `projeto`, `execucao`.

### Documents

```bash
contextos docs upload <brainId> ./manual-produto.pdf
contextos docs upload <brainId> ./tom-de-voz.md
contextos docs list <brainId>
contextos docs delete <documentId>
```

Extensões: `.pdf .md .txt`. Limite: 25MB. Worker indexa em background — `docs list` mostra status (`uploading` → `indexing` → `ready` / `error`).

### Auth utils

```bash
contextos auth whoami
contextos auth logout -n ci
```

---

## Padrões úteis

### Compile + LLM via shell pipe

```bash
contextos compile $BRAIN -w $WS -q "$QUERY" --format markdown | \
  ollama run llama3 "$(cat -)"
```

### Bulk upload de docs

```bash
for f in ./docs/*.md; do
  contextos docs upload $BRAIN "$f"
done
```

### CI smoke check

```bash
contextos brains list -w $WS --json | jq -e '.total >= 1' || exit 1
```

---

## Variáveis de ambiente (resumo)

| Var | Função |
|---|---|
| `CONTEXTOS_URL` | URL do servidor — junto com `CONTEXTOS_API_KEY` cria perfil `env` |
| `CONTEXTOS_API_KEY` | API key Bearer |
| `CONTEXTOS_WORKSPACE_ID` | Workspace default pra `-w` |
| `CONTEXTOS_PROFILE` | Nome do perfil ativo (alternativa a `-p`) |

---

## Erros comuns

| Mensagem | Causa |
|---|---|
| `HTTP 401: unauthenticated` | API key inválida ou revogada |
| `HTTP 403: workspace_mismatch` | Key pertence a outro workspace |
| `HTTP 403: forbidden` | Escopo da memória não pertence ao usuário/key |
| `HTTP 415: unsupported_mime` | Doc não é .pdf/.md/.txt |
| `HTTP 413: file_too_large` | Doc > 25MB |
| `Falha de rede` | Servidor offline ou URL errada |

Status `0` = sucesso, `1` = qualquer falha.
