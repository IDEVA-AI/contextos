'use client'

import type { DragEvent } from 'react'

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
  defaultMode: 'single' | 'multi'
  defaultPriority: number
}

const PALETTE: PaletteItem[] = [
  {
    type: 'persona',
    label: 'Persona',
    color: '#C5F432',
    description: 'Identidade do agente',
    defaultMode: 'single',
    defaultPriority: 70
  },
  {
    type: 'rule',
    label: 'Regra',
    color: '#EF4444',
    description: 'Constraint forte',
    defaultMode: 'multi',
    defaultPriority: 85
  },
  {
    type: 'context_block',
    label: 'Contexto',
    color: '#71717A',
    description: 'Bloco genérico',
    defaultMode: 'multi',
    defaultPriority: 50
  },
  {
    type: 'memory',
    label: 'Memória',
    color: '#0EA5E9',
    description: 'Aprendizado salvo',
    defaultMode: 'multi',
    defaultPriority: 50
  },
  {
    type: 'document',
    label: 'Documento',
    color: '#8B5CF6',
    description: 'Arquivo de referência',
    defaultMode: 'multi',
    defaultPriority: 40
  },
  {
    type: 'knowledge',
    label: 'Knowledge',
    color: '#14B8A6',
    description: 'Chunk indexado',
    defaultMode: 'multi',
    defaultPriority: 40
  },
  {
    type: 'output_template',
    label: 'Output',
    color: '#F59E0B',
    description: 'Formato de saída',
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
    <aside className="floating-panel absolute top-3 left-3 z-20 w-44 p-2">
      <div className="mono text-[10px] uppercase tracking-wider text-zinc-400 px-1 mb-2">
        Blocos · arrasta pro canvas
      </div>
      <ul className="space-y-1">
        {PALETTE.map((item) => (
          <li
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            className="cursor-grab active:cursor-grabbing flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-50 transition-colors select-none"
            title={item.description}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium leading-tight">{item.label}</div>
              <div className="text-[10px] text-zinc-500 truncate leading-tight">
                {item.description}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
