'use client'

import Link from 'next/link'
import { useReactFlow, useViewport } from '@xyflow/react'
import {
  FileText,
  Sparkles,
  History,
  HelpCircle,
  Maximize2,
  MessageCircle,
  ZoomIn,
  ZoomOut,
  type LucideIcon
} from 'lucide-react'

type Props = {
  nodeCount: number
  edgeCount: number
  docsOpen: boolean
  compileOpen: boolean
  versionsOpen: boolean
  chatOpen: boolean
  onToggleDocs: () => void
  onToggleCompile: () => void
  onToggleVersions: () => void
  onToggleChat: () => void
}

export function BottomToolbar({
  nodeCount,
  edgeCount,
  docsOpen,
  compileOpen,
  versionsOpen,
  chatOpen,
  onToggleDocs,
  onToggleCompile,
  onToggleVersions,
  onToggleChat
}: Props) {
  const rf = useReactFlow()
  const { zoom } = useViewport()

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 floating-panel px-2 py-1.5 shadow-lg">
      <ToolbarButton
        icon={MessageCircle}
        label="Chat"
        active={chatOpen}
        accent="#C5F432"
        onClick={onToggleChat}
        primary
      />
      <ToolbarButton
        icon={Sparkles}
        label="Compilar"
        active={compileOpen}
        onClick={onToggleCompile}
      />
      <ToolbarButton
        icon={FileText}
        label="Documentos"
        active={docsOpen}
        onClick={onToggleDocs}
      />
      <ToolbarButton
        icon={History}
        label="Versões"
        active={versionsOpen}
        onClick={onToggleVersions}
      />

      <Divider />

      <ToolbarButton
        icon={ZoomOut}
        label="Zoom -"
        onClick={() => rf.zoomOut({ duration: 150 })}
      />
      <button
        type="button"
        onClick={() => rf.fitView({ padding: 0.15, duration: 200 })}
        className="mono text-[10px] tabular-nums text-zinc-500 hover:text-zinc-900 px-1.5 py-1 rounded hover:bg-zinc-50 transition-colors min-w-[42px] text-center"
        title="Fit view"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton
        icon={ZoomIn}
        label="Zoom +"
        onClick={() => rf.zoomIn({ duration: 150 })}
      />
      <ToolbarButton
        icon={Maximize2}
        label="Encaixar tudo"
        onClick={() => rf.fitView({ padding: 0.15, duration: 250 })}
      />

      <Divider />

      <div className="flex items-center gap-3 px-2 mono text-[10px] tabular-nums text-zinc-400">
        <span>
          <span className="text-zinc-700 font-medium">{nodeCount}</span> nós
        </span>
        <span>
          <span className="text-zinc-700 font-medium">{edgeCount}</span> edges
        </span>
      </div>

      <Divider />

      <Link
        href="/help"
        target="_blank"
        className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
        title="Ajuda"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-200" />
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  accent,
  primary,
  onClick
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  accent?: string
  primary?: boolean
  onClick: () => void
}) {
  const base =
    'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all'

  if (primary) {
    const bg = accent ?? '#C5F432'
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} text-zinc-900 hover:brightness-95`}
        style={{
          background: active ? bg : `${bg}40`,
          boxShadow: active ? `0 0 0 1px ${bg}` : undefined
        }}
        title={label}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        <span className="hidden sm:inline">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${
        active
          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
      }`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
