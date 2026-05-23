'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Format = 'markdown' | 'messages' | 'json' | 'mcp'

type CompileResponse = {
  package_id?: string
  trace_id?: string
  stats?: {
    tokensEstimated: number
    blocksConsidered: number
    blocksIncluded: number
    blocksExcluded: number
    warnings: string[]
  }
  markdown?: string
  messages?: Array<{ role: string; content: string }>
  [k: string]: unknown
}

export function CompilePanel({
  workspaceId,
  brainId
}: {
  workspaceId: string
  brainId: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [task, setTask] = useState('')
  const [budget, setBudget] = useState(4000)
  const [format, setFormat] = useState<Format>('markdown')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCompile() {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/v1/context/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          brain_id: brainId,
          query,
          task: task || undefined,
          format,
          budget_tokens: budget
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Erro ao compilar')
        return
      }
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  const preview =
    result?.markdown ??
    (result?.messages
      ? JSON.stringify(result.messages, null, 2)
      : result
        ? JSON.stringify(result, null, 2)
        : null)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="floating-panel absolute top-4 right-[14.5rem] z-20 px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 transition-colors"
        title="Compilar contexto"
      >
        <span className="mono text-[10px] text-zinc-400 mr-1.5">c</span>
        Compilar
      </button>

      {open && (
        <aside className="floating-panel absolute top-16 right-[14.5rem] z-20 w-96 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
            <span className="text-xs font-medium">Compilar contexto</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-900 leading-none p-1"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div className="p-3 space-y-3 border-b border-zinc-100">
            <div className="space-y-1.5">
              <Label htmlFor="cmp-query">Query</Label>
              <Textarea
                id="cmp-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={2}
                placeholder="Ex: criar proposta para cliente Delta"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="cmp-task">Task (opcional)</Label>
                <Input
                  id="cmp-task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="proposta comercial"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cmp-format">Formato</Label>
                <select
                  id="cmp-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as Format)}
                  className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs"
                >
                  <option value="markdown">markdown</option>
                  <option value="messages">messages</option>
                  <option value="json">json</option>
                  <option value="mcp">mcp</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cmp-budget">Budget tokens</Label>
                <span className="mono text-[10px] text-zinc-500">{budget}</span>
              </div>
              <input
                id="cmp-budget"
                type="range"
                min={500}
                max={16000}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Number.parseInt(e.target.value, 10))}
                className="w-full accent-brand-300"
              />
            </div>

            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={loading || !query.trim()}
              onClick={handleCompile}
              className="w-full"
            >
              {loading ? 'Compilando...' : 'Compilar'}
            </Button>

            {error && (
              <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-3 space-y-3">
            {!result && !loading && (
              <p className="text-[11px] text-zinc-500">
                Compila pra ver o pacote que vai pra IA.
              </p>
            )}
            {result?.stats && (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <Stat
                  label="tokens"
                  value={result.stats.tokensEstimated.toString()}
                />
                <Stat
                  label="incluídos"
                  value={`${result.stats.blocksIncluded}/${result.stats.blocksConsidered}`}
                />
                <Stat
                  label="trace"
                  value={result.trace_id?.slice(0, 8) ?? '—'}
                  mono
                />
                <Stat
                  label="pkg id"
                  value={result.package_id?.slice(0, 12) ?? '—'}
                  mono
                />
              </div>
            )}
            {result?.stats?.warnings && result.stats.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="mono text-[10px] uppercase tracking-wider text-amber-600">
                  Warnings
                </div>
                {result.stats.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1"
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}
            {preview && (
              <pre className="bg-zinc-50 border border-zinc-100 rounded p-2 text-[10px] leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                {preview}
              </pre>
            )}
          </div>
        </aside>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  mono
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="border border-zinc-100 rounded px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
        {label}
      </div>
      <div className={mono ? 'mono text-[10px]' : 'text-[11px] font-medium'}>
        {value}
      </div>
    </div>
  )
}
