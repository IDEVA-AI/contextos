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
    <aside className="floating-panel absolute top-3 left-3 z-20 w-48 p-1.5">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="mono text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-medium">
          Blocos
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className="text-zinc-300"
          aria-hidden
        >
          <circle cx="3" cy="3" r="1" fill="currentColor" />
          <circle cx="9" cy="3" r="1" fill="currentColor" />
          <circle cx="3" cy="9" r="1" fill="currentColor" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
        </svg>
      </div>
      <ul className="space-y-px">
        {PALETTE.map((item) => (
          <li
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            className="group cursor-grab active:cursor-grabbing flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-50 transition-all select-none border-l-2 border-transparent hover:border-l-2"
            style={{ '--accent': item.color } as React.CSSProperties}
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
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
              style={{
                background: item.color,
                boxShadow: `0 0 0 1px ${item.color}33`
              }}
            />
            <span className="flex-1 text-[11px] font-medium text-zinc-800 leading-tight truncate">
              {item.label}
            </span>
            <span className="mono text-[9px] text-zinc-300 group-hover:text-zinc-500 transition-colors tabular-nums">
              p{item.defaultPriority}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-zinc-100 mt-1.5 pt-1.5 px-2 flex items-center gap-1">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="text-zinc-300" aria-hidden>
          <path
            d="M2 6h7m0 0L6 3m3 3L6 9"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[9px] text-zinc-400 leading-none">arrasta pro canvas</span>
      </div>
    </aside>
  )
}
