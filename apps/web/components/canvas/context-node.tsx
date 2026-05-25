'use client'

import { Handle, type NodeProps, Position } from '@xyflow/react'
import {
  User,
  ShieldAlert,
  StickyNote,
  Brain,
  FileText,
  Sparkles,
  Layout,
  type LucideIcon
} from 'lucide-react'
import type { CanvasNodeData } from '@/lib/node'

const TYPE_INFO: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  context_block: { label: 'context', color: '#71717A', icon: StickyNote },
  persona: { label: 'persona', color: '#C5F432', icon: User },
  rule: { label: 'rule', color: '#EF4444', icon: ShieldAlert },
  memory: { label: 'memory', color: '#0EA5E9', icon: Brain },
  document: { label: 'document', color: '#8B5CF6', icon: FileText },
  knowledge: { label: 'knowledge', color: '#14B8A6', icon: Sparkles },
  output_template: { label: 'output', color: '#F59E0B', icon: Layout }
}

export function ContextNode({ data, type, selected }: NodeProps) {
  const nodeData = data as CanvasNodeData
  const typeInfo = TYPE_INFO[type as string] ?? TYPE_INFO.context_block!
  const Icon = typeInfo.icon

  return (
    <div
      className={
        selected
          ? 'floating-panel min-w-44 max-w-60 p-2.5 ring-2 ring-brand-300'
          : 'floating-panel min-w-44 max-w-60 p-2.5'
      }
      style={{
        opacity: nodeData.enabled ? 1 : 0.5,
        borderTop: `2px solid ${typeInfo.color}`
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-zinc-300 !border-0"
      />

      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${typeInfo.color}1A`, color: typeInfo.color }}
        >
          <Icon className="w-3 h-3" strokeWidth={2.2} />
        </span>
        <span className="mono text-[9px] uppercase tracking-wider text-zinc-400">
          {typeInfo.label}
        </span>
        <span className="mono text-[9px] text-zinc-300 ml-auto tabular-nums">
          p{nodeData.priority}
        </span>
      </div>

      <div className="font-medium text-xs leading-tight mb-1 truncate text-zinc-900">
        {nodeData.title || '(sem título)'}
      </div>

      {nodeData.content && (
        <div className="text-[10px] text-zinc-500 line-clamp-2 leading-snug">
          {nodeData.content}
        </div>
      )}

      {nodeData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {nodeData.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="mono text-[9px] text-zinc-500 bg-zinc-100 px-1 rounded leading-tight"
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
