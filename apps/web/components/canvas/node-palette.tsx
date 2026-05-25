'use client'

import type { DragEvent } from 'react'
import {
  User,
  ShieldAlert,
  StickyNote,
  Brain,
  FileText,
  Sparkles,
  Layout,
  GripVertical,
  MoveRight
} from 'lucide-react'

export type NodeType =
  | 'context_block'
  | 'persona'
  | 'rule'
  | 'memory'
  | 'document'
  | 'knowledge'
  | 'output_template'

type PaletteItem = {
  type: NodeType
  label: string
  color: string
  description: string
  icon: typeof User
  defaultMode: 'single' | 'multi'
  defaultPriority: number
}

const PALETTE: PaletteItem[] = [
  {
    type: 'persona',
    label: 'Persona',
    color: '#C5F432',
    description: 'Identidade do agente',
    icon: User,
    defaultMode: 'single',
    defaultPriority: 70
  },
  {
    type: 'rule',
    label: 'Regra',
    color: '#EF4444',
    description: 'Constraint forte',
    icon: ShieldAlert,
    defaultMode: 'multi',
    defaultPriority: 85
  },
  {
    type: 'context_block',
    label: 'Contexto',
    color: '#71717A',
    description: 'Bloco genérico',
    icon: StickyNote,
    defaultMode: 'multi',
    defaultPriority: 50
  },
  {
    type: 'memory',
    label: 'Memória',
    color: '#0EA5E9',
    description: 'Aprendizado salvo',
    icon: Brain,
    defaultMode: 'multi',
    defaultPriority: 50
  },
  {
    type: 'document',
    label: 'Documento',
    color: '#8B5CF6',
    description: 'Arquivo de referência',
    icon: FileText,
    defaultMode: 'multi',
    defaultPriority: 40
  },
  {
    type: 'knowledge',
    label: 'Knowledge',
    color: '#14B8A6',
    description: 'Chunk indexado',
    icon: Sparkles,
    defaultMode: 'multi',
    defaultPriority: 40
  },
  {
    type: 'output_template',
    label: 'Output',
    color: '#F59E0B',
    description: 'Formato de saída',
    icon: Layout,
    defaultMode: 'single',
    defaultPriority: 60
  }
]

export type PaletteDragPayload = {
  type: NodeType
  defaultMode: 'single' | 'multi'
  defaultPriority: number
  label: string
}

export function NodePalette() {
  function handleDragStart(event: DragEvent<HTMLElement>, item: PaletteItem) {
    const payload: PaletteDragPayload = {
      type: item.type,
      defaultMode: item.defaultMode,
      defaultPriority: item.defaultPriority,
      label: item.label
    }
    event.dataTransfer.setData(
      'application/contextos-node',
      JSON.stringify(payload)
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="floating-panel absolute top-4 left-4 z-20 w-56 p-2">
      <div className="flex items-center justify-between px-2 pt-1.5 pb-2.5">
        <span className="mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">
          Blocos
        </span>
        <GripVertical className="w-3 h-3 text-zinc-300" />
      </div>
      <ul className="space-y-0.5">
        {PALETTE.map((item) => {
          const Icon = item.icon
          return (
            <li
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="group cursor-grab active:cursor-grabbing flex items-center gap-2.5 px-2 py-2 rounded-md transition-all select-none border-l-2 border-transparent"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = item.color
                e.currentTarget.style.backgroundColor = `${item.color}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent'
                e.currentTarget.style.backgroundColor = ''
              }}
              title={item.description}
            >
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: `${item.color}1A`,
                  color: item.color
                }}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-800 leading-tight truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight truncate">
                  {item.description}
                </div>
              </div>
              <span className="mono text-[9px] text-zinc-300 group-hover:text-zinc-500 transition-colors tabular-nums flex-shrink-0">
                p{item.defaultPriority}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-zinc-100 mt-1.5 pt-2 px-2 flex items-center gap-1.5">
        <MoveRight className="w-3 h-3 text-zinc-300" />
        <span className="text-[10px] text-zinc-400 leading-none">arrasta pro canvas</span>
      </div>
    </aside>
  )
}
