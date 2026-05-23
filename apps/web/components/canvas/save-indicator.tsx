'use client'

import type { SaveStatus } from './use-autosave'

const LABEL: Record<SaveStatus, string> = {
  idle: 'salvo',
  dirty: 'editado',
  saving: 'salvando...',
  saved: 'salvo',
  error: 'erro ao salvar'
}

const COLOR: Record<SaveStatus, string> = {
  idle: '#a1a1aa',
  dirty: '#F59E0B',
  saving: '#0EA5E9',
  saved: '#84BD11',
  error: '#EF4444'
}

export function SaveIndicator({
  status,
  lastSavedAt
}: {
  status: SaveStatus
  lastSavedAt: Date | null
}) {
  const time =
    lastSavedAt &&
    lastSavedAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

  return (
    <div className="floating-panel absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: COLOR[status],
          animation:
            status === 'saving' ? 'pulse-brand 1.4s ease-out infinite' : undefined
        }}
      />
      <span className="text-[11px] font-medium">{LABEL[status]}</span>
      {time && status !== 'saving' && status !== 'dirty' && (
        <span className="mono text-[10px] text-zinc-400">às {time}</span>
      )}
    </div>
  )
}
