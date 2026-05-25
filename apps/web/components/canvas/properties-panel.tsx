'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CanvasNode, CanvasNodeData } from '@/lib/node'

const SCOPES = [
  'global',
  'workspace',
  'empresa',
  'projeto',
  'cliente',
  'processo',
  'agente',
  'execucao',
  'temporario'
] as const

const TYPE_LABELS: Record<string, string> = {
  context_block: 'Contexto',
  persona: 'Persona',
  rule: 'Regra',
  memory: 'Memória',
  document: 'Documento',
  knowledge: 'Knowledge',
  output_template: 'Output'
}

type Props = {
  node: CanvasNode | null
  onChange: (nodeId: string, patch: Partial<CanvasNodeData>) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

export function PropertiesPanel({ node, onChange, onDelete, onClose }: Props) {
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    setTagInput('')
  }, [node?.id])

  if (!node) return null

  const data = node.data

  function addTag(raw: string) {
    if (!node) return
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    if (data.tags.includes(tag)) return
    onChange(node.id, { tags: [...data.tags, tag] })
    setTagInput('')
  }

  function removeTag(tag: string) {
    if (!node) return
    onChange(node.id, { tags: data.tags.filter((t) => t !== tag) })
  }

  const typeLabel = TYPE_LABELS[node.type as string] ?? node.type

  return (
    <aside className="floating-panel absolute top-4 right-4 z-20 w-64 max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-100 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="mono text-[9px] uppercase tracking-wider text-zinc-400">
            {typeLabel}
          </span>
          <span className="mono text-[9px] text-zinc-300">p{data.priority}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-900 leading-none p-0.5 text-xs"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto p-2.5 space-y-2">
        <div className="space-y-1">
          <Label htmlFor={`title-${node.id}`} className="text-[10px]">Título</Label>
          <Input
            id={`title-${node.id}`}
            value={data.title}
            onChange={(e) => onChange(node.id, { title: e.target.value })}
            maxLength={200}
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`content-${node.id}`} className="text-[10px]">Conteúdo</Label>
          <Textarea
            id={`content-${node.id}`}
            value={data.content ?? ''}
            onChange={(e) =>
              onChange(node.id, { content: e.target.value || null })
            }
            rows={3}
            placeholder="Texto, instrução, fato, exemplo..."
            className="text-xs leading-snug"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`priority-${node.id}`} className="text-[10px]">Prioridade</Label>
            <span className="mono text-[9px] text-zinc-500">{data.priority}</span>
          </div>
          <input
            id={`priority-${node.id}`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={data.priority}
            onChange={(e) =>
              onChange(node.id, { priority: Number.parseInt(e.target.value, 10) })
            }
            className="w-full accent-brand-300 h-1"
          />
          <div className="flex justify-between mono text-[8px] text-zinc-400">
            <span>30 nota</span>
            <span>70 persona</span>
            <span>100 system</span>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`scope-${node.id}`} className="text-[10px]">Escopo</Label>
          <select
            id={`scope-${node.id}`}
            value={data.scope}
            onChange={(e) =>
              onChange(node.id, {
                scope: e.target.value as CanvasNodeData['scope']
              })
            }
            className="flex h-7 w-full rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Modo</Label>
          <div className="grid grid-cols-2 gap-1">
            {(['single', 'multi'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(node.id, { mode: m })}
                className={
                  data.mode === m
                    ? 'h-7 rounded-md border border-zinc-900 bg-zinc-900 text-white text-[11px] font-medium'
                    : 'h-7 rounded-md border border-zinc-200 bg-white text-zinc-600 text-[11px] hover:bg-zinc-50'
                }
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-zinc-500 leading-snug">
            {data.mode === 'single'
              ? 'Só o de maior prioridade vence na compilação.'
              : 'Todos somam, ordenados por prioridade.'}
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`tags-${node.id}`} className="text-[10px]">Tags (RBAC)</Label>
          <div className="flex flex-wrap gap-0.5 min-h-5">
            {data.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="mono text-[9px] bg-zinc-100 hover:bg-red-100 hover:text-red-700 text-zinc-600 px-1 py-0 rounded transition-colors"
                title="Click pra remover"
              >
                {tag} ×
              </button>
            ))}
          </div>
          <Input
            id={`tags-${node.id}`}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(tagInput)
              }
            }}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder="Enter pra adicionar"
            className="h-6 text-[11px]"
          />
          <p className="text-[9px] text-zinc-500 leading-snug">
            Tags = RBAC (ex: <span className="mono">public</span>,{' '}
            <span className="mono">client:delta</span>).
          </p>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => onChange(node.id, { enabled: e.target.checked })}
            className="accent-brand-300 h-3 w-3"
          />
          <span className="text-[11px]">Ativo</span>
        </label>
      </div>

      <div className="border-t border-zinc-100 p-2 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(node.id)}
          className="w-full h-7 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
        >
          Apagar nó
        </Button>
      </div>
    </aside>
  )
}
