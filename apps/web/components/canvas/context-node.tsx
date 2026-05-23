'use client'

import { Handle, type NodeProps, Position } from '@xyflow/react'
import type { CanvasNodeData } from '@/lib/node'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  context_block: { label: 'context', color: '#71717A' },
  persona: { label: 'persona', color: '#C5F432' },
  rule: { label: 'rule', color: '#EF4444' },
  memory: { label: 'memory', color: '#0EA5E9' },
  document: { label: 'document', color: '#8B5CF6' },
  knowledge: { label: 'knowledge', color: '#14B8A6' },
  output_template: { label: 'output', color: '#F59E0B' }
}

export function ContextNode({ data, type, selected }: NodeProps) {
  const nodeData = data as CanvasNodeData
  const typeInfo = TYPE_LABELS[type as string] ?? TYPE_LABELS.context_block

  return (
    <div
      className={
        selected
          ? 'floating-panel min-w-44 max-w-64 p-3 ring-2 ring-brand-300'
          : 'floating-panel min-w-44 max-w-64 p-3'
      }
      style={{ opacity: nodeData.enabled ? 1 : 0.5 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-zinc-300 !border-0"
      />

      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: typeInfo!.color }}
        />
        <span className="mono text-[9px] uppercase tracking-wider text-zinc-400">
          {typeInfo!.label}
        </span>
        <span className="mono text-[9px] text-zinc-400 ml-auto">
          p{nodeData.priority}
        </span>
      </div>

      <div className="font-medium text-xs leading-tight mb-1 truncate">
        {nodeData.title || '(sem título)'}
      </div>

      {nodeData.content && (
        <div className="text-[10px] text-zinc-500 line-clamp-3 leading-relaxed">
          {nodeData.content}
        </div>
      )}

      {nodeData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {nodeData.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="mono text-[9px] text-zinc-500 bg-zinc-100 px-1 rounded"
            >
              {tag}
            </span>
          ))}
          {nodeData.tags.length > 3 && (
            <span className="mono text-[9px] text-zinc-400">
              +{nodeData.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-zinc-300 !border-0"
      />
    </div>
  )
}
