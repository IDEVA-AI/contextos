import Link from 'next/link'

export const metadata = {
  title: 'Ajuda · ContextOS'
}

export default function HelpPage() {
  return (
    <div className="space-y-12 pb-16">
      <Hero />
      <QuickStart />
      <Concepts />
      <NodeTypes />
      <PriorityAndScope />
      <Memories />
      <Documents />
      <Access />
      <Compile />
      <Versions />
      <Plug />
      <Prompts />
      <Cheatsheet />
      <Footer />
    </div>
  )
}

// ============================================================
// HERO
// ============================================================

function Hero() {
  return (
    <section>
      <div className="mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
        Ajuda · Tutorial completo
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
        Como usar o <span className="font-display text-zinc-500">ContextOS</span>
      </h1>
      <p className="text-sm text-zinc-600 mt-3 max-w-2xl leading-relaxed">
        ContextOS é um <strong>servidor de contexto operacional plugável</strong>. Você modela
        contexto uma vez no canvas — qualquer IA da sua stack consome via REST, MCP ou Webhook.
        Esse guia te leva do zero ao "Claude Desktop usando seu cérebro" em 15 minutos.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <TocChip href="#quick-start" label="Quick start" />
        <TocChip href="#concepts" label="Conceitos" />
        <TocChip href="#nodes" label="Tipos de nó" />
        <TocChip href="#priority" label="Prioridade + escopo" />
        <TocChip href="#memories" label="Memórias" />
        <TocChip href="#documents" label="Documents" />
        <TocChip href="#access" label="Acesso (API keys)" />
        <TocChip href="#compile" label="Compilar" />
        <TocChip href="#versions" label="Versões" />
        <TocChip href="#plug" label="Plugar Claude Desktop" />
        <TocChip href="#prompts" label="Prompts prontos" />
      </div>
    </section>
  )
}

// ============================================================
// QUICK START
// ============================================================

function QuickStart() {
  return (
    <section id="quick-start" className="scroll-mt-8">
      <SectionLabel num="1" title="Quick start em 3 passos" />
      <div className="grid md:grid-cols-3 gap-3">
        <Step
          n="01"
          title="Cria um workspace"
          desc="Workspace é o nível mais alto. 1 empresa = 1 workspace, em geral."
          action="Vai pra /dashboard e clica em 'Criar workspace'."
        />
        <Step
          n="02"
          title="Cria um projeto + cérebro"
          desc="Projeto agrupa cérebros relacionados. Cada cérebro é um canvas com blocos de contexto."
          action="Dentro do workspace, cria projeto e depois cérebro. Ou usa um template pronto."
        />
        <Step
          n="03"
          title="Pluga IA via API key"
          desc="Cria uma chave em /access e configura no Claude Desktop / Cursor / curl. IA passa a consultar o cérebro."
          action="Detalhes na seção 'Plugar Claude Desktop' lá embaixo."
        />
      </div>
    </section>
  )
}

// ============================================================
// CONCEPTS
// ============================================================

function Concepts() {
  return (
    <section id="concepts" className="scroll-mt-8">
      <SectionLabel num="2" title="Conceitos chave" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        ContextOS tem 4 níveis de hierarquia. Entender isso primeiro economiza muito atrito.
      </p>

      <div className="floating-panel p-5">
        <Tree />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <Definition
          term="Workspace"
          def="Top-level. Tem um dono (você). Carrega memórias institucionais, API keys e governança."
        />
        <Definition
          term="Projeto"
          def="Agrupa cérebros relacionados (ex: 'Comercial', 'Jurídico')."
        />
        <Definition
          term="Cérebro"
          def="Um canvas com blocos. Cada cérebro vira um endpoint que IA pluga (ex: cérebro de proposta comercial)."
        />
        <Definition
          term="Nó (bloco)"
          def="Unidade atômica de contexto: persona, regra, fato, memória, documento. Cada nó tem tipo, prioridade, escopo, tags."
        />
      </div>
    </section>
  )
}

function Tree() {
  return (
    <pre className="mono text-[11px] leading-relaxed text-zinc-700 overflow-x-auto">
{`Workspace "Acme"
  ├─ API Keys (governança)
  ├─ Memórias (workspace-wide)
  └─ Projeto "Comercial"
        ├─ Memórias do projeto
        └─ Cérebro "Agente de proposta"
              ├─ 🟢 Persona "Consultor sênior"
              ├─ 🔴 Regra "Não prometer ROI"
              ├─ ⚫ Fato "Tabela de preços"
              ├─ 🟣 Document "Política comercial 2026.pdf"
              │     ↓ indexação automática
              │     ├─ 🌊 Chunk #1 (com embedding)
              │     └─ 🌊 Chunk #2 (com embedding)
              ├─ 🟠 Output template "Estrutura de proposta"
              └─ versões v1 · v2 · v3 ...`}
    </pre>
  )
}

// ============================================================
// NODE TYPES
// ============================================================

function NodeTypes() {
  const nodes = [
    {
      type: 'Persona',
      color: '#C5F432',
      mode: 'single',
      prio: 70,
      desc: 'Identidade. Só 1 ativa por execução.',
      ex: '"Você é consultor sênior de estratégia B2B."'
    },
    {
      type: 'Regra (Rule)',
      color: '#EF4444',
      mode: 'multi',
      prio: 85,
      desc: 'Constraint forte. Várias podem coexistir.',
      ex: '"Nunca prometer ROI garantido. Citar próximos passos."'
    },
    {
      type: 'Contexto (Context Block)',
      color: '#71717A',
      mode: 'multi',
      prio: 50,
      desc: 'Fato, dado, info genérica.',
      ex: '"Cliente Acme atua no setor industrial."'
    },
    {
      type: 'Memória',
      color: '#0EA5E9',
      mode: 'multi',
      prio: 50,
      desc: 'Aprendizado, decisão passada, padrão observado.',
      ex: '"Cliente Delta rejeitou proposta com prazo 6 meses."'
    },
    {
      type: 'Documento',
      color: '#8B5CF6',
      mode: 'multi',
      prio: 40,
      desc: 'Arquivo PDF/MD/TXT. Indexado automaticamente em chunks.',
      ex: '"Política comercial 2026.pdf"'
    },
    {
      type: 'Knowledge',
      color: '#14B8A6',
      mode: 'multi',
      prio: 40,
      desc: 'Chunk indexável (gerado a partir de Documents).',
      ex: 'Pedaço de texto com embedding pgvector pra busca semântica.'
    },
    {
      type: 'Output Template',
      color: '#F59E0B',
      mode: 'single',
      prio: 60,
      desc: 'Formato esperado de saída. Só 1 ativo.',
      ex: '"Proposta deve ter: 1) Diagnóstico, 2) Solução, 3) Próximos passos."'
    }
  ]

  return (
    <section id="nodes" className="scroll-mt-8">
      <SectionLabel num="3" title="7 tipos de nó · quando usar cada um" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Cada bloco no canvas tem um <strong>tipo</strong> que define cor, comportamento e
        prioridade default. Arrasta da palette esquerda pro canvas.
      </p>

      <div className="space-y-2">
        {nodes.map((n) => (
          <div
            key={n.type}
            className="floating-panel p-4 flex flex-col md:flex-row md:items-center gap-3"
          >
            <div className="flex items-center gap-3 md:w-56 flex-shrink-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: n.color }}
              />
              <div>
                <div className="font-medium text-sm">{n.type}</div>
                <div className="mono text-[10px] text-zinc-400">
                  mode={n.mode} · prio default {n.prio}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-700 leading-relaxed">{n.desc}</div>
              <div className="mono text-[10px] text-zinc-500 mt-1 italic">{n.ex}</div>
            </div>
          </div>
        ))}
      </div>

      <Callout>
        <strong>Mode single vs multi:</strong> blocos <code>single</code> (Persona, Output Template)
        só permitem 1 ativo por compilação — vence o de maior prioridade. Blocos <code>multi</code>{' '}
        somam todos, ordenados por prioridade.
      </Callout>
    </section>
  )
}

// ============================================================
// PRIORITY + SCOPE
// ============================================================

function PriorityAndScope() {
  return (
    <section id="priority" className="scroll-mt-8">
      <SectionLabel num="4" title="Prioridade, escopo e modo · como o Compiler escolhe" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Quando você chama <code>/v1/context/compile</code>, o ContextOS aplica essa lógica:
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <RankCard
          label="Prioridade"
          desc="Critério primário. 100 = system. 30 = nota auxiliar."
        >
          <ul className="mono text-[10px] text-zinc-600 space-y-1 mt-2">
            <li>100 system</li>
            <li>95 segurança</li>
            <li>90 compliance</li>
            <li>85 regra do projeto</li>
            <li>70 persona</li>
            <li>50 memória</li>
            <li>40 exemplo</li>
            <li>30 nota</li>
          </ul>
        </RankCard>
        <RankCard
          label="Escopo (desempate)"
          desc="Quando 2 blocos têm a mesma prioridade, ganha o de escopo mais específico."
        >
          <ul className="mono text-[10px] text-zinc-600 space-y-1 mt-2">
            <li>global ← menos específico</li>
            <li>workspace</li>
            <li>empresa</li>
            <li>projeto</li>
            <li>cliente</li>
            <li>execução ← mais específico</li>
          </ul>
        </RankCard>
        <RankCard
          label="Relevância semântica"
          desc="Embedding cosine similarity com a query. Pondera com prioridade e recência."
        >
          <pre className="mono text-[10px] text-zinc-600 mt-2 leading-relaxed">
            {`finalScore =
  relevance  × 0.6
+ priority/100 × 0.3
+ recency  × 0.1`}
          </pre>
        </RankCard>
      </div>

      <Callout>
        <strong>Sem embeddings (offline mode):</strong> se <code>OPENAI_API_KEY</code> não estiver
        setada, busca cai pra match textual (substring/palavra). Funciona mas é menos preciso.
      </Callout>
    </section>
  )
}

// ============================================================
// MEMORIES
// ============================================================

function Memories() {
  return (
    <section id="memories" className="scroll-mt-8">
      <SectionLabel num="5" title="Memórias · aprendizados persistentes" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Memórias são lembranças, decisões, padrões observados. Diferente de blocos do canvas,
        memórias têm 3 escopos:
      </p>

      <div className="grid md:grid-cols-3 gap-3">
        <Definition
          term="workspace"
          def="Aplica em todos os cérebros do workspace. Ex: tom de voz da empresa."
        />
        <Definition
          term="projeto"
          def="Aplica só nos cérebros do projeto. Ex: padrão de proposta comercial."
        />
        <Definition
          term="execução"
          def="Criada durante uma consulta da IA. Opcional persistir."
        />
      </div>

      <div className="floating-panel p-4 mt-4 space-y-2">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400">
          Como criar
        </div>
        <ol className="text-xs text-zinc-700 space-y-1.5 list-decimal pl-5 leading-relaxed">
          <li>Workspace → clica <strong>Memórias</strong></li>
          <li>Form: escolhe escopo (workspace ou projeto), título opcional, conteúdo</li>
          <li>Salva — embedding é gerado automaticamente (se OPENAI_API_KEY ativa)</li>
        </ol>
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 pt-2">
          Como IA externa cria memória
        </div>
        <CodeSnippet>
          {`POST /v1/memory/create
Authorization: Bearer ctx_sk_live_xxx
Content-Type: application/json

{
  "workspace_id": "ws_xxx",
  "scope_type": "projeto",
  "scope_id": "proj_xxx",
  "content": "Cliente Delta prefere reuniões objetivas de 30min.",
  "tags": ["client:delta"]
}`}
        </CodeSnippet>
      </div>
    </section>
  )
}

// ============================================================
// DOCUMENTS
// ============================================================

function Documents() {
  return (
    <section id="documents" className="scroll-mt-8">
      <SectionLabel num="6" title="Documents · indexação automática" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Sobe PDF/MD/TXT (até 25MB) e o worker BullMQ extrai texto, divide em chunks de ~500 tokens
        e gera embeddings. Os chunks viram blocos Knowledge consumíveis pelo Compiler.
      </p>

      <div className="floating-panel p-5">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Pipeline de indexação
        </div>
        <Flow
          steps={[
            'Upload via Docs panel no canvas',
            'Status: uploading',
            'Worker pega job (Redis BullMQ)',
            'Extract texto (unpdf pra PDF, raw pra MD/TXT)',
            'Chunk em ~500 tokens',
            'Embed batch (OpenAI text-embedding-3-small, dim 1536)',
            'Insert em knowledge_chunks com tags',
            'Status: ready'
          ]}
        />
      </div>

      <Callout>
        Sem <code>OPENAI_API_KEY</code>: chunks são salvos sem embedding. Busca cai pra ILIKE
        textual. Quando você setar a key, embeddings entram automaticamente (sem mudança de código).
      </Callout>
    </section>
  )
}

// ============================================================
// ACCESS
// ============================================================

function Access() {
  return (
    <section id="access" className="scroll-mt-8">
      <SectionLabel num="7" title="Acesso ao Cérebro · API keys e RBAC" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Pra IA externa consumir o cérebro, você cria uma <strong>API key</strong> com{' '}
        <strong>scopes</strong>. Scopes controlam quais blocos a IA enxerga via{' '}
        <strong>RBAC tag-based</strong>.
      </p>

      <div className="floating-panel p-5 mb-3">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
          Regra de matching (default-deny)
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">
          Bloco entra na resposta SE <strong>todas suas tags</strong> ∈ scopes da key. Wildcards:{' '}
          <code>*</code> universal, <code>prefix:*</code> prefix match.
        </p>
      </div>

      <div className="floating-panel p-5">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">
          Exemplo prático
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-1.5 pr-3 font-medium">Bloco</th>
              <th className="text-left py-1.5 pr-3 font-medium">Tags</th>
              <th className="text-left py-1.5 pr-3 font-medium">
                key1 scopes <code className="text-zinc-400">[public]</code>
              </th>
              <th className="text-left py-1.5 font-medium">
                key2 scopes <code className="text-zinc-400">[commercial, client:*]</code>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100">
              <td className="py-1.5 pr-3">Persona pública</td>
              <td className="py-1.5 pr-3 mono text-[10px]">[public]</td>
              <td className="py-1.5 pr-3" style={{ color: '#84BD11' }}>
                ✓ vê
              </td>
              <td className="py-1.5" style={{ color: '#EF4444' }}>
                ✗ não vê
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-1.5 pr-3">Tabela de preços</td>
              <td className="py-1.5 pr-3 mono text-[10px]">[commercial]</td>
              <td className="py-1.5 pr-3" style={{ color: '#EF4444' }}>
                ✗
              </td>
              <td className="py-1.5" style={{ color: '#84BD11' }}>
                ✓
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-1.5 pr-3">Memória do cliente Delta</td>
              <td className="py-1.5 pr-3 mono text-[10px]">[commercial, client:delta]</td>
              <td className="py-1.5 pr-3" style={{ color: '#EF4444' }}>
                ✗
              </td>
              <td className="py-1.5" style={{ color: '#84BD11' }}>
                ✓ (client:* cobre client:delta)
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Salários executivos</td>
              <td className="py-1.5 pr-3 mono text-[10px]">[hr, confidential]</td>
              <td className="py-1.5 pr-3" style={{ color: '#EF4444' }}>
                ✗
              </td>
              <td className="py-1.5" style={{ color: '#EF4444' }}>
                ✗
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout>
        <strong>Cuidado:</strong> bloco SEM tags só é visível com scope <code>public</code>.
        Default-deny protege contra vazamento acidental.
      </Callout>
    </section>
  )
}

// ============================================================
// COMPILE
// ============================================================

function Compile() {
  return (
    <section id="compile" className="scroll-mt-8">
      <SectionLabel num="8" title="Compilar · ver o que a IA recebe" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        O botão <strong>Compilar</strong> no canvas mostra exatamente o pacote que vai pra IA.
        Útil pra debugar: o que entrou, o que cortou, por quê.
      </p>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <FormatCard
          format="markdown"
          desc="Texto pronto pra system prompt. Ideal pra colar no chat."
          sample={`# Persona
Você é consultor sênior...

# Regras
- Não prometer ROI...

# Tarefa
criar proposta`}
        />
        <FormatCard
          format="messages"
          desc="Array {role, content} pra OpenAI/Anthropic Chat Completions."
          sample={`[
  {"role":"system","content":"# Persona..."},
  {"role":"system","content":"# Fatos..."},
  {"role":"user","content":"criar proposta"}
]`}
        />
      </div>

      <div className="floating-panel p-5">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
          Botão "⚡ Testar com IA"
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">
          Compila + manda pra Anthropic/OpenAI real (detecta provider pela env var) e mostra a
          resposta. Precisa de <code>ANTHROPIC_API_KEY</code> ou <code>OPENAI_API_KEY</code> em{' '}
          <code>.env.local</code>. Sem nenhuma: retorna 503 explicando.
        </p>
      </div>
    </section>
  )
}

// ============================================================
// VERSIONS
// ============================================================

function Versions() {
  return (
    <section id="versions" className="scroll-mt-8">
      <SectionLabel num="9" title="Versionamento · snapshot + restore" />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Cada save de cérebro pode virar uma <strong>versão imutável</strong>. Restaurar é
        não-destrutivo: cria nova versão a partir da escolhida, mantém histórico.
      </p>

      <div className="floating-panel p-5">
        <ol className="text-xs text-zinc-700 space-y-2 list-decimal pl-5 leading-relaxed">
          <li>
            No canvas, topo direito → <strong>Versões</strong>
          </li>
          <li>Drawer abre com input de descrição opcional</li>
          <li>
            Clica <strong>Salvar versão agora</strong> → snapshot JSON completo gerado
          </li>
          <li>
            Lista de versões anteriores com timestamp + conta de nós/edges
          </li>
          <li>
            <strong>Restaurar</strong> em qualquer versão → cria nova "Restaurado de:" com aquele
            estado
          </li>
        </ol>
      </div>

      <Callout>
        Trace de toda compilação registra <code>brain_version_id</code> usado. Você pode rastrear
        qual versão estava ativa quando uma resposta de IA foi gerada.
      </Callout>
    </section>
  )
}

// ============================================================
// PLUG
// ============================================================

function Plug() {
  return (
    <section id="plug" className="scroll-mt-8">
      <SectionLabel
        num="10"
        title="Plugar Claude Desktop · marco do produto"
      />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        O ContextOS expõe um <strong>MCP server</strong> em <code>/mcp</code>. Claude Desktop,
        Cursor, Cline, Zed — qualquer cliente MCP pode plugar e usar as 5 tools.
      </p>

      <div className="space-y-3">
        <PlugStep n="01" title="Cria API key">
          <p className="text-xs text-zinc-700 leading-relaxed">
            Vai em <strong>Acesso ao cérebro</strong> do seu workspace. Cria key com scopes (use{' '}
            <code>*</code> pra acesso total em dev). Copia a chave <strong>agora</strong> — só
            aparece 1x.
          </p>
        </PlugStep>

        <PlugStep n="02" title="Edita config Claude Desktop">
          <p className="text-xs text-zinc-700 mb-2">
            Path por OS:
            <br />
            macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
            <br />
            Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code>
          </p>
          <CodeSnippet>
            {`{
  "mcpServers": {
    "contextos": {
      "transport": {
        "type": "streamable-http",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "Authorization": "Bearer ctx_sk_live_xxx"
        }
      }
    }
  }
}`}
          </CodeSnippet>
        </PlugStep>

        <PlugStep n="03" title="Restart Claude Desktop">
          <p className="text-xs text-zinc-700 leading-relaxed">
            Cmd+Q + abre de novo. Claude faz handshake MCP automático e baixa as 5 tools.
          </p>
        </PlugStep>

        <PlugStep n="04" title="Testa no chat">
          <div className="space-y-2">
            <p className="text-xs text-zinc-700">
              Pede ao Claude:
            </p>
            <div className="floating-panel bg-brand-50/40 border-brand-200 p-3 text-xs leading-relaxed">
              "Liste os cérebros disponíveis."
              <br />
              "Compile contexto pra 'criar proposta para cliente Delta' do cérebro X."
              <br />
              "Salve memória: cliente Delta valoriza propostas curtas."
            </div>
            <p className="text-xs text-zinc-700">
              Ele chama <code>list_brains</code>, <code>compile_context</code>,{' '}
              <code>save_memory</code> e usa as respostas no resto da conversa.{' '}
              <strong>A IA literalmente ganha acesso ao seu cérebro operacional.</strong>
            </p>
          </div>
        </PlugStep>
      </div>

      <div className="floating-panel p-4 mt-4">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
          5 tools MCP expostas
        </div>
        <ul className="text-xs space-y-1.5">
          <li>
            <code className="mono text-zinc-700">list_brains</code> — lista cérebros acessíveis
          </li>
          <li>
            <code className="mono text-zinc-700">retrieve_context</code> — blocos brutos rankeados
          </li>
          <li>
            <code className="mono text-zinc-700">compile_context</code> — pacote pronto pra LLM
          </li>
          <li>
            <code className="mono text-zinc-700">search_memory</code> — busca semântica
          </li>
          <li>
            <code className="mono text-zinc-700">save_memory</code> — IA preserva aprendizados
          </li>
        </ul>
      </div>
    </section>
  )
}

// ============================================================
// PROMPTS PRONTOS
// ============================================================

function Prompts() {
  return (
    <section id="prompts" className="scroll-mt-8">
      <SectionLabel
        num="11"
        title="Prompts prontos · cola na sua IA favorita"
      />
      <p className="text-sm text-zinc-600 mb-4 max-w-2xl">
        Copy-paste pra <strong>Claude Code</strong>, <strong>Codex</strong>,{' '}
        <strong>Cursor</strong>, <strong>Claude Desktop</strong>, ou qualquer IA com tool use.
        Substitui <code className="mono text-[11px]">&lt;WORKSPACE_ID&gt;</code>,{' '}
        <code className="mono text-[11px]">&lt;BRAIN_ID&gt;</code> e{' '}
        <code className="mono text-[11px]">&lt;API_KEY&gt;</code> pelos seus valores reais (pega em{' '}
        <Link href="/dashboard" className="underline decoration-zinc-400">
          Acesso ao cérebro
        </Link>
        ).
      </p>

      <div className="space-y-3">
        <PromptCard
          n="01"
          tool="Claude Code / Codex / qualquer IA com filesystem"
          objective="Configurar o MCP do ContextOS no Claude Desktop"
          when="Você quer plugar o cérebro no Claude Desktop sem editar JSON manualmente."
          prompt={`Quero plugar o ContextOS (servidor de contexto operacional) no Claude Desktop via MCP.

Faz isso pra mim:

1. Detecta meu OS e abre o arquivo de config do Claude Desktop:
   - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   - Windows: %APPDATA%\\Claude\\claude_desktop_config.json
   - Linux: ~/.config/Claude/claude_desktop_config.json

2. Se o arquivo não existir, cria com objeto vazio { "mcpServers": {} }.

3. Adiciona (ou substitui se já existir) a entrada "contextos":

{
  "mcpServers": {
    "contextos": {
      "transport": {
        "type": "streamable-http",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "Authorization": "Bearer <API_KEY>"
        }
      }
    }
  }
}

4. Preserva qualquer outro MCP server já configurado.

5. Confirma o conteúdo final do arquivo.

Depois me lembra de reiniciar o Claude Desktop (Cmd+Q + abrir de novo).`}
        />

        <PromptCard
          n="02"
          tool="Claude Code / Codex / Cursor agent"
          objective="Configurar o MCP do ContextOS no Cursor"
          when="Quer usar Composer/Agent do Cursor com seu cérebro."
          prompt={`Quero plugar o ContextOS no Cursor via MCP.

Edita ou cria o arquivo ~/.cursor/mcp.json adicionando o servidor "contextos":

{
  "mcpServers": {
    "contextos": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer <API_KEY>"
      }
    }
  }
}

Preserva qualquer outro servidor MCP existente. Depois me orienta a:
- Abrir Settings → MCP no Cursor
- Confirmar que "contextos" aparece como "Connected"
- Testar no Composer/Agent: "liste os cérebros do meu workspace"`}
        />

        <PromptCard
          n="03"
          tool="Claude Code / Codex (com shell)"
          objective="Bootstrapar workspace + projeto + cérebro + API key via REST"
          when="Setup zero — quer tudo criado por shell antes de ir pra UI."
          prompt={`Cria a estrutura inicial do meu ContextOS via REST. Servidor roda em http://localhost:3000.

Já tenho user logado com cookie de sessão (ou me ajuda a fazer signup via POST /api/auth/signup com email/senha que vou te dar).

Sequência:

1. POST /api/workspaces { "name": "<NOME_WORKSPACE>", "slug": "<slug>" } → guarda workspace_id
2. POST /api/workspaces/{workspace_id}/projects { "name": "<NOME_PROJETO>" } → guarda project_id
3. POST /api/projects/{project_id}/brains { "name": "<NOME_CEREBRO>", "description": "..." } → guarda brain_id
4. POST /api/workspaces/{workspace_id}/api-keys { "name": "agent-key", "scopes": ["*"] } → exibe o secret completo (só aparece 1x)

Usa curl com cookie jar (/tmp/contextos-cookies.txt). No final me mostra:
- workspace_id
- project_id
- brain_id
- API key secret completa

Esses 4 valores eu vou colar nos próximos prompts.`}
        />

        <PromptCard
          n="04"
          tool="Claude Desktop / Cursor / qualquer IA com MCP do ContextOS plugado"
          objective="Popular o cérebro vazio com persona + regras + memórias"
          when="Cérebro recém-criado, quer enchê-lo via conversa em vez de canvas."
          prompt={`Você tem acesso ao MCP do ContextOS. Quero que você popule o cérebro <BRAIN_ID> no workspace <WORKSPACE_ID> com a configuração abaixo.

Use a tool save_memory pra cada item, com scope_type="workspace" e scope_id=<WORKSPACE_ID>.

Persona (1 item, single, prioridade alta):
- title: "Persona"
- content: "Você é um SDR B2B sênior, tom direto e técnico, sem fluff comercial. Prova social via cases concretos."
- tags: ["voice", "public"]

Regras (3 itens, multi, prioridade alta):
- "Nunca dar desconto antes de qualificar BANT completo."
- "Resposta inicial sempre em até 2 parágrafos."
- "Cite sempre o nome do produto sem encurtar."
(tags: ["rules", "commercial"])

Memórias (3 itens, multi, prioridade média):
- "ICP é dev solo IA-pesado que usa Claude Code + Cursor + n8n."
- "Cases fortes: Funil365, IDEVA-AI, MoneyBrand."
- "Faixa de ticket: R$ 5k–50k mensais."
(tags: ["context", "commercial"])

Depois lista de volta o que criou (memory ids + títulos) pra eu confirmar.`}
        />

        <PromptCard
          n="05"
          tool="Claude Desktop / Cursor / qualquer IA com MCP plugado"
          objective="Smoke test completo do MCP"
          when="Acabou de configurar o MCP, quer validar que tudo funciona end-to-end."
          prompt={`Você tem o MCP do ContextOS plugado. Roda esse smoke test e me reporta cada passo:

1. Chama list_brains. Mostra os cérebros disponíveis com id + nome + project_name.

2. Pega o primeiro cérebro retornado (ou usa <BRAIN_ID> se eu te passei). Chama retrieve_context com query="teste de integração" e limit=5. Mostra quantos blocos voltaram, types e prioridades.

3. Chama compile_context com:
   - brain_id: o mesmo do passo 2
   - query: "responder lead pedindo proposta comercial"
   - format: "markdown"
   - budget_tokens: 2000

   Mostra o markdown compilado + stats (tokens_estimated, blocks_included).

4. Chama save_memory com:
   - workspace_id: <WORKSPACE_ID>
   - scope_type: "workspace"
   - scope_id: <WORKSPACE_ID>
   - title: "Smoke test"
   - content: "MCP funcionando em <data atual>"
   - tags: ["smoke", "public"]

   Mostra o memory_id retornado.

5. Chama search_memory com query="smoke" + workspace_id. Confirma que a memória recém-criada aparece nos resultados.

No final, dá um resumo: ✓ ou ✗ pra cada um dos 5 passos.`}
        />

        <PromptCard
          n="06"
          tool="Claude Desktop / Cursor / qualquer IA com MCP plugado"
          objective="Importar um system prompt longo (ChatGPT/Claude) pra blocos do ContextOS"
          when="Você tem um system prompt enorme num custom GPT/Claude project e quer migrar pro cérebro."
          prompt={`Vou colar abaixo um system prompt longo. Quero que você o decomponha em blocos do ContextOS e os salve no cérebro <BRAIN_ID> do workspace <WORKSPACE_ID>.

Regras de decomposição:
- Tom de voz / persona → 1 memória com title="Persona", tags=["voice"], prioridade implícita alta
- Regras de comportamento ("você nunca", "sempre faça") → 1 memória por regra, tags=["rules"]
- Fatos do produto/empresa (nomes, preços, processos) → 1 memória por fato, tags=["facts"]
- Exemplos de input/output → 1 memória por exemplo, tags=["examples"]
- Instruções de formato (markdown, JSON) → 1 memória, title="Output format", tags=["output"]

Pra cada bloco extraído chame save_memory com scope_type="workspace" e scope_id=<WORKSPACE_ID>.

No final me liste o que criou (id + title + tags + content resumido em 1 linha) numa tabela markdown.

=== SYSTEM PROMPT ORIGINAL ===
<cola aqui o system prompt completo>
=== FIM ===`}
        />

        <PromptCard
          n="07"
          tool="Claude Code / Codex (com shell)"
          objective="Debugar MCP que não conecta ou retorna erro"
          when="Plugou no Claude Desktop/Cursor mas tools não aparecem ou dão erro."
          prompt={`O MCP do ContextOS não está funcionando no meu cliente (Claude Desktop ou Cursor). Diagnostica:

1. curl http://localhost:3000/health → deve retornar status:"ok" com db.ok + redis.ok=true. Se não, infra não está de pé.

2. curl -X POST http://localhost:3000/mcp \\
     -H "Authorization: Bearer <API_KEY>" \\
     -H "Content-Type: application/json" \\
     -H "Accept: application/json, text/event-stream" \\
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"debug","version":"0"}}}'

   - Espera-se 200 com serverInfo.name="contextos" + protocolVersion + capabilities.
   - 401 = chave inválida ou revogada.
   - 403 com "mcp_requires_api_key_scoped_to_workspace" = chave OK mas precisa estar scoped a workspace específico.

3. curl -X POST http://localhost:3000/mcp \\
     -H "Authorization: Bearer <API_KEY>" \\
     -H "Content-Type: application/json" \\
     -H "Accept: application/json, text/event-stream" \\
     -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

   - Deve retornar 5 tools: list_brains, retrieve_context, compile_context, search_memory, save_memory.

4. Verifica que o arquivo de config do cliente MCP tem a entrada correta (path varia por OS — pergunta antes se não souber).

5. Se o cliente foi reiniciado depois de editar a config.

Reporta o resultado de cada passo + a hipótese provável da falha.`}
        />
      </div>

      <div className="floating-panel p-4 mt-4 bg-brand-50/30 border-brand-200">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
          Dica
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">
          Salva esses prompts num arquivo <code>contextos-prompts.md</code> no seu cofre (Obsidian,
          Notion, ou um <em>memory</em> do próprio ContextOS!) pra reutilizar. Cada prompt é
          auto-contido — não depende dos outros.
        </p>
      </div>
    </section>
  )
}

function PromptCard({
  n,
  tool,
  objective,
  when,
  prompt
}: {
  n: string
  tool: string
  objective: string
  when: string
  prompt: string
}) {
  return (
    <div className="floating-panel p-4">
      <div className="flex items-start gap-3 mb-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center mono text-[10px] flex-shrink-0 mt-0.5"
          style={{ background: '#C5F432', color: '#0a0a0a' }}
        >
          {n}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{objective}</div>
          <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mt-1">
            {tool}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-600 mb-2 ml-9">
        <span className="mono text-zinc-400">quando: </span>
        {when}
      </p>
      <div className="ml-9">
        <CodeSnippet>{prompt}</CodeSnippet>
      </div>
    </div>
  )
}

// ============================================================
// CHEATSHEET
// ============================================================

function Cheatsheet() {
  return (
    <section className="scroll-mt-8">
      <SectionLabel num="12" title="Cheatsheet · comandos úteis" />

      <div className="grid md:grid-cols-2 gap-3">
        <div className="floating-panel p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
            REST API (Bearer token)
          </div>
          <CodeSnippet>
            {`# Compilar contexto
curl -X POST http://localhost:3000/v1/context/compile \\
  -H "Authorization: Bearer $KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "workspace_id":"ws_xxx",
    "brain_id":"brain_xxx",
    "query":"criar proposta",
    "format":"markdown"
  }'

# Buscar memória
curl -X POST http://localhost:3000/v1/memory/search \\
  -H "Authorization: Bearer $KEY" \\
  -d '{
    "workspace_id":"ws_xxx",
    "scope_type":"workspace",
    "scope_id":"ws_xxx",
    "query":"objeções comerciais",
    "limit":5
  }'`}
          </CodeSnippet>
        </div>

        <div className="floating-panel p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
            Operação local
          </div>
          <CodeSnippet>
            {`# Health check
curl http://localhost:3000/health

# Subir infra (Postgres + Redis)
pnpm infra:up

# Aplicar mudanças no schema
pnpm db:push

# Visualizar banco (UI)
pnpm db:studio

# Subir worker (em outro terminal)
pnpm --filter @contextos/worker dev

# Limpar tudo e recomeçar
docker compose down -v && docker compose up -d`}
          </CodeSnippet>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================

function Footer() {
  return (
    <section className="border-t border-zinc-200/70 pt-8">
      <div className="floating-panel p-5">
        <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
          Próximos recursos
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <a
            href="https://github.com/IDEVA-AI/contextos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-900 underline"
          >
            → GitHub (Apache 2.0)
          </a>
          <Link href="/dashboard" className="text-zinc-700 hover:text-zinc-900 underline">
            → Voltar pro dashboard
          </Link>
        </div>
        <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed">
          ContextOS v0.1.0 — Servidor de contexto operacional plugável. Modele uma vez, qualquer
          IA consome.{' '}
          <span className="font-display italic text-zinc-400">
            Modelos são substituíveis. Contexto proprietário não é.
          </span>
        </p>
      </div>
    </section>
  )
}

// ============================================================
// PRIMITIVES
// ============================================================

function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="mono text-[10px] uppercase tracking-wider text-zinc-400">
        {num}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

function TocChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="floating-panel px-3 py-1 text-[11px] hover:bg-zinc-50 transition-colors"
    >
      {label}
    </a>
  )
}

function Step({
  n,
  title,
  desc,
  action
}: {
  n: string
  title: string
  desc: string
  action: string
}) {
  return (
    <div className="floating-panel p-4 space-y-2">
      <div className="mono text-[10px] uppercase tracking-wider text-zinc-400">
        passo {n}
      </div>
      <div className="font-medium text-sm">{title}</div>
      <p className="text-xs text-zinc-600 leading-relaxed">{desc}</p>
      <p className="text-[11px] text-zinc-500 italic leading-relaxed">{action}</p>
    </div>
  )
}

function Definition({ term, def }: { term: string; def: string }) {
  return (
    <div className="floating-panel p-3">
      <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
        {term}
      </div>
      <p className="text-xs text-zinc-700 leading-relaxed">{def}</p>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="floating-panel mt-4 bg-brand-50/40 border-brand-200 p-3 text-xs text-zinc-700 leading-relaxed">
      💡 {children}
    </div>
  )
}

function CodeSnippet({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-zinc-900 text-zinc-100 rounded-md p-3 mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre">
      {children}
    </pre>
  )
}

function RankCard({
  label,
  desc,
  children
}: {
  label: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="floating-panel p-4">
      <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
        {label}
      </div>
      <p className="text-xs text-zinc-700 leading-relaxed mb-2">{desc}</p>
      {children}
    </div>
  )
}

function Flow({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-zinc-700">
          <span
            className="mono text-[9px] text-zinc-400 mt-0.5 flex-shrink-0 w-6"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  )
}

function FormatCard({
  format,
  desc,
  sample
}: {
  format: string
  desc: string
  sample: string
}) {
  return (
    <div className="floating-panel p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="mono text-[10px] uppercase tracking-wider text-zinc-400">
          format=
        </span>
        <code className="mono text-[11px] font-medium">{format}</code>
      </div>
      <p className="text-xs text-zinc-700 leading-relaxed mb-2">{desc}</p>
      <pre className="bg-zinc-50 border border-zinc-100 rounded p-2 mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre">
        {sample}
      </pre>
    </div>
  )
}

function PlugStep({
  n,
  title,
  children
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="floating-panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center mono text-[10px] flex-shrink-0"
          style={{ background: '#C5F432', color: '#0a0a0a' }}
        >
          {n}
        </span>
        <div className="font-medium text-sm">{title}</div>
      </div>
      <div className="ml-8 space-y-2">{children}</div>
    </div>
  )
}
