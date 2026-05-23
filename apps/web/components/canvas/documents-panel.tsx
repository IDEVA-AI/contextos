'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type DocStatus = 'uploading' | 'indexing' | 'ready' | 'error'

type DocItem = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  status: DocStatus
  createdAt: string
  chunkCount: number
}

const STATUS_COLOR: Record<DocStatus, string> = {
  uploading: '#a1a1aa',
  indexing: '#F59E0B',
  ready: '#84BD11',
  error: '#EF4444'
}

const STATUS_LABEL: Record<DocStatus, string> = {
  uploading: 'subindo',
  indexing: 'indexando',
  ready: 'pronto',
  error: 'erro'
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

export function DocumentsPanel({ brainId }: { brainId: string }) {
  const [open, setOpen] = useState(false)
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/brains/${brainId}/documents`, {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [brainId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Polling enquanto algum doc tá processando
  useEffect(() => {
    if (!open) return
    const stillProcessing = docs.some(
      (d) => d.status === 'uploading' || d.status === 'indexing'
    )
    if (!stillProcessing) return

    pollRef.current = setTimeout(load, 3000)
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [open, docs, load])

  async function handleUpload(file: File) {
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/brains/${brainId}/documents`, {
        method: 'POST',
        body: form
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const errMap: Record<string, string> = {
          unsupported_mime: 'Tipo não suportado (PDF/MD/TXT)',
          file_too_large: 'Arquivo passa de 25MB',
          file_required: 'Selecione um arquivo'
        }
        setError(errMap[body.error] ?? 'Erro ao subir')
        return
      }
      await load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar documento e todos os chunks?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="floating-panel absolute top-4 right-[10.5rem] z-20 px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 transition-colors"
        title="Documentos"
      >
        <span className="mono text-[10px] text-zinc-400 mr-1.5">d</span>
        Docs
      </button>

      {open && (
        <aside className="floating-panel absolute top-16 right-[10.5rem] z-20 w-72 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
            <span className="text-xs font-medium">Documentos</span>
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
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.md,.txt,application/pdf,text/markdown,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full"
            >
              {uploading ? 'Subindo...' : '+ Upload (PDF/MD/TXT, max 25MB)'}
            </Button>
            {error && (
              <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-3 space-y-2">
            {loading && (
              <p className="text-[11px] text-zinc-500">Carregando...</p>
            )}
            {!loading && docs.length === 0 && (
              <p className="text-[11px] text-zinc-500">
                Sem documentos. Faça upload pra indexar.
              </p>
            )}
            {docs.map((d) => (
              <div
                key={d.id}
                className="border border-zinc-100 rounded-md p-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium truncate flex-1 min-w-0">
                    {d.fileName}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    className="mono text-[10px] text-zinc-400 hover:text-red-600 flex-shrink-0"
                  >
                    apagar
                  </button>
                </div>
                <div className="flex items-center gap-2 mono text-[10px] text-zinc-500">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: STATUS_COLOR[d.status],
                      animation:
                        d.status === 'indexing'
                          ? 'pulse-brand 1.4s ease-out infinite'
                          : undefined
                    }}
                  />
                  <span>{STATUS_LABEL[d.status]}</span>
                  <span className="text-zinc-300">·</span>
                  <span>{fmtBytes(d.sizeBytes)}</span>
                  {d.chunkCount > 0 && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span>{d.chunkCount} chunks</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </>
  )
}
