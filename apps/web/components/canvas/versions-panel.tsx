'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSnapshotAction,
  restoreVersionAction
} from '@/app/actions/version'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type VersionItem = {
  id: string
  description: string | null
  createdAt: string
  nodeCount: number
  edgeCount: number
}

export function VersionsPanel({
  brainId,
  open: controlledOpen,
  onOpenChange
}: {
  brainId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = onOpenChange !== undefined
  const open = isControlled ? !!controlledOpen : internalOpen
  const setOpen = (v: boolean | ((p: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v
    if (isControlled) onOpenChange(next)
    else setInternalOpen(next)
  }
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/brains/${brainId}/versions`, {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSnapshot() {
    startTransition(async () => {
      const result = await createSnapshotAction({
        brainId,
        description: description.trim() || undefined
      })
      if (result.ok) {
        setDescription('')
        await load()
      }
    })
  }

  function handleRestore(versionId: string) {
    if (!confirm('Restaurar essa versão? Cria nova versão a partir dela.')) return
    startTransition(async () => {
      const result = await restoreVersionAction({ brainId, versionId })
      if (result.ok) {
        router.refresh()
        await load()
      }
    })
  }

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="floating-panel absolute top-4 right-[20rem] z-20 px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 transition-colors"
          title="Versões"
        >
          <span className="mono text-[10px] text-zinc-400 mr-1.5">v</span>
          Versões
        </button>
      )}

      {open && (
        <aside className="floating-panel absolute top-16 right-[20rem] z-20 w-72 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
            <span className="text-xs font-medium">Versões</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-900 leading-none p-1"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div className="p-3 border-b border-zinc-100 space-y-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              maxLength={200}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={pending}
              onClick={handleSnapshot}
              className="w-full"
            >
              {pending ? 'Salvando...' : 'Salvar versão agora'}
            </Button>
          </div>

          <div className="overflow-y-auto p-3 space-y-2">
            {loading && (
              <p className="text-[11px] text-zinc-500">Carregando...</p>
            )}
            {!loading && versions.length === 0 && (
              <p className="text-[11px] text-zinc-500">
                Sem versões salvas ainda.
              </p>
            )}
            {versions.map((v) => (
              <div
                key={v.id}
                className="border border-zinc-100 rounded-md p-2 space-y-1"
              >
                <div className="mono text-[10px] text-zinc-400">
                  {new Date(v.createdAt).toLocaleString('pt-BR')}
                </div>
                {v.description && (
                  <div className="text-xs leading-snug">{v.description}</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-zinc-500">
                    {v.nodeCount} nós · {v.edgeCount} edges
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRestore(v.id)}
                    disabled={pending}
                    className="mono text-[10px] text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                  >
                    restaurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </>
  )
}
