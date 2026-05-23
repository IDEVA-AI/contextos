# MCP Guide — Plugue Claude Desktop no ContextOS

O servidor MCP do ContextOS expõe **5 tools** que qualquer cliente compatível com Model Context Protocol pode chamar: **Claude Desktop, Cursor, Continue, Cline, Zed**, ou qualquer outro.

Quando você pluga, sua IA ganha acesso ao **cérebro operacional inteiro**: ela busca contexto, compila pacotes, salva memórias — sem você ter que copiar e colar nada.

---

## Setup em 4 passos

### 1. Crie uma API Key

1. No browser, vá em **http://localhost:3000/workspaces/[seu-workspace]/access**
2. Clica **+ Nova chave** no form
3. Define **scopes** (separados por vírgula):
   - `*` → acesso total (use só pra dev local)
   - `public, commercial, client:*` → exemplo restrito
   - vazio → só blocos com tag `public`
4. Copia a chave (`ctx_sk_live_xxx...`) **agora** — só aparece 1x

### 2. Edite o config do Claude Desktop

Localização do arquivo:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Adiciona o servidor (substitua URL e KEY pelos seus):

```json
{
  "mcpServers": {
    "contextos": {
      "transport": {
        "type": "streamable-http",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "Authorization": "Bearer ctx_sk_live_xxxSUA_CHAVE_AQUIxxx"
        }
      }
    }
  }
}
```

> **Self-hosted em produção?** Troque `http://localhost:3000` pela URL pública do seu ContextOS (ex: `https://contextos.suaempresa.com`).

### 3. Reinicia o Claude Desktop

Cmd+Q + abre de novo. Quando o app subir, ele negocia o MCP e baixa a lista de tools automaticamente.

### 4. Teste no chat

Pede pro Claude:

> "Liste os cérebros disponíveis"

Ele chama `list_brains` e mostra. Depois:

> "Compile contexto pra `criar proposta para cliente Delta` do cérebro [id]"

Ele chama `compile_context` e usa o resultado como contexto no resto da conversa. **A IA literalmente ganha acesso ao seu cérebro operacional.**

---

## Tools disponíveis

| Tool | O que faz |
|---|---|
| `list_brains` | Lista cérebros (canvases) acessíveis pela API key |
| `retrieve_context` | Blocos brutos rankeados por relevância. Use pra inspecionar o que tá disponível. |
| `compile_context` | Pacote pronto pra LLM: aplica RBAC, ranking, budget de tokens. Formatos: `markdown` (default, ideal pra system prompt), `messages` (array OpenAI/Anthropic), `json` (schema canônico). |
| `search_memory` | Busca memórias por similaridade semântica (embedding cosine) ou textual (fallback). |
| `save_memory` | Salva nova memória no escopo escolhido (workspace/projeto/execucao). Use pra IA preservar aprendizados. |

---

## RBAC funciona automaticamente

A key carrega seus scopes. Quando a IA chama `compile_context` ou `retrieve_context`, o ContextOS:

1. Carrega blocos do cérebro
2. **Filtra** — bloco entra se TODAS suas tags ∈ scopes da key
3. Rankeia + compila

Se você criar key com scope `commercial`, blocos com tag `confidential` **não aparecem** pra essa IA. Default-deny. Wildcards: `*` (universal), `prefix:*` (prefix match).

---

## Troubleshooting

### "Tool 'contextos:compile_context' is not available"
- Reinicia o Claude Desktop
- Confere se o JSON do config tá válido (sem vírgula sobrando, etc)
- Testa o endpoint manualmente:
  ```bash
  curl -X POST http://localhost:3000/mcp \
    -H "Authorization: Bearer $YOUR_KEY" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
  ```

### 401 unauthenticated
- Key digitada errada ou revogada
- Confere em `/workspaces/[id]/access` se ela ainda existe

### MCP requires API key scoped to workspace
- MCP precisa Bearer com key — cookie de session não funciona

### A IA não vê os blocos que eu criei
- Confere as **tags** do bloco no canvas
- Confere os **scopes** da key
- Pra ver tudo durante teste, use scope `*`

---

## Logs

Toda chamada MCP é registrada em `execution_traces`. Vai em **`/workspaces/[id]/access`** → seção Logs pra ver:
- Qual key chamou
- Qual endpoint
- Quantos blocos foram retornados
- Quantos tokens
- Quanto tempo levou

---

## Próximos passos

- **Cursor / Continue / Cline**: mesma config — todos suportam MCP via streamable HTTP.
- **Claude API (sem Desktop)**: use o REST `/v1/context/compile` direto, mesmo Bearer.
- **n8n / Zapier**: igual REST via Bearer.

📖 [Protocol oficial](https://modelcontextprotocol.io) · [PRD §10](../PRD_v0.1.md#10-spec-mcp-server)
