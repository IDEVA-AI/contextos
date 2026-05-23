# @contextos/cli

CLI oficial do ContextOS — gerencie cérebros, memórias, documentos e compile contexto direto do terminal. Pensado pra dev solo / agente / pipeline CI.

## Install

Dentro do mono-repo:

```bash
pnpm --filter @contextos/cli build
node packages/cli/dist/index.js --help
```

Pra instalar como binário global em qualquer lugar:

```bash
pnpm --filter @contextos/cli link --global
contextos --help
```

> O bin é `contextos`. Funciona em Node 20+.

## Login

```bash
contextos auth login
```

Prompts interativos: nome do perfil (`default`), URL do servidor (`http://localhost:3000`) e API key (`ctx_sk_live_...`). A chave é validada contra `/v1/brains` antes de salvar.

Perfis ficam em `~/.contextos/config.json` (chmod 600). Use `-p, --profile <nome>` em qualquer comando pra trocar.

**Não-interativo** (CI):

```bash
contextos auth login --name ci --url $URL --key $KEY
```

**Via env** (sem profile):

```bash
export CONTEXTOS_URL=http://localhost:3000
export CONTEXTOS_API_KEY=ctx_sk_live_...
export CONTEXTOS_WORKSPACE_ID=...
```

## Comandos

### `brains list`

```bash
contextos brains list -w <workspace_id>
contextos brains list -w <workspace_id> --json
```

### `compile <brainId>`

Compila pacote de contexto pronto pro LLM.

```bash
contextos compile <brainId> -w <workspaceId> -q "proposta comercial"
contextos compile <brainId> -w <ws> -q "..." --format messages --budget 4000
contextos compile <brainId> -w <ws> -q "..." --task "responder lead" --scope public --scope commercial
```

Formatos: `markdown` (default), `messages` (OpenAI/Anthropic), `json` (canônico), `mcp`.

### `retrieve <brainId>`

Lista blocos rankeados sem compilar pacote.

```bash
contextos retrieve <brainId> -w <ws> -q "tom de voz"
contextos retrieve <brainId> -w <ws> -q "..." --top-k 20 --json
```

### `memory create / search`

```bash
contextos memory create -w <ws> --scope-type workspace --scope-id <ws> \
  --title "Tom" --content "Direto, sem fluff." --tags voice

# stdin
echo "Cliente B2B é dev solo" | contextos memory create -w <ws> \
  --scope-type workspace --scope-id <ws> --title "ICP"

contextos memory search -w <ws> --scope-type workspace --scope-id <ws> -q "tom"
```

Scope types: `workspace`, `projeto`, `execucao`.

### `docs upload / list / delete`

```bash
contextos docs upload <brainId> ./manual.md
contextos docs upload <brainId> ./policy.pdf
contextos docs list <brainId>
contextos docs delete <documentId>
```

Extensões suportadas: `.pdf .md .txt`. Limite: 25MB. Worker indexa em background.

### `auth whoami / logout`

```bash
contextos auth whoami
contextos auth logout -n <profile>
```

## Variáveis de ambiente

| Var | Quando |
|---|---|
| `CONTEXTOS_URL` | Override URL (junto com `CONTEXTOS_API_KEY` ignora profile) |
| `CONTEXTOS_API_KEY` | Override key |
| `CONTEXTOS_WORKSPACE_ID` | Default workspace pra `-w` (opcional) |
| `CONTEXTOS_PROFILE` | Default profile (alternativa a `-p`) |

## Output

Todos os comandos aceitam `--json` pra output cru — bom pra pipeline (`jq`, `xargs`, etc).

```bash
contextos brains list -w $WS --json | jq '.brains[] | .id'
```

## Erros

Erros HTTP saem com mensagem do servidor (`HTTP 403: workspace_mismatch`, etc). Códigos de saída: `0` sucesso, `1` qualquer falha.

## Licença

Apache 2.0 — segue o repo.
