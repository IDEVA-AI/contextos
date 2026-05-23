'use client'

import { useState, useTransition } from 'react'
import { createApiKeyAction } from '@/app/actions/api-key'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ApiKeyCreateForm({ workspaceId }: { workspaceId: string }) {
  const [pending, startTransition] = useTransition()
  const [revealed, setRevealed] = useState<{
    name: string
    secret: string
    scopes: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createApiKeyAction(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setRevealed({
        name: result.name,
        secret: result.secret,
        scopes: result.scopes
      })
    })
  }

  if (revealed) {
    return (
      <div className="floating-panel p-5 space-y-4 border-2 border-amber-200">
        <div>
          <h3 className="text-base font-semibold">⚠️ Copie a chave agora</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Essa chave não aparece de novo. Após fechar, só dá pra revogar.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <div className="text-sm font-medium">{revealed.name}</div>
        </div>
        <div className="space-y-1.5">
          <Label>Scopes</Label>
          <div className="flex flex-wrap gap-1">
            {revealed.scopes.length === 0 ? (
              <span className="mono text-[10px] text-zinc-400">
                (sem scopes — só blocos com tag 'public')
              </span>
            ) : (
              revealed.scopes.map((s) => (
                <span
                  key={s}
                  className="mono text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded"
                >
                  {s}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Chave secreta</Label>
          <div className="bg-zinc-900 text-zinc-100 rounded-md p-3 mono text-[11px] break-all">
            {revealed.secret}
          </div>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(revealed.secret)
            }}
            className="w-full"
          >
            Copiar chave
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRevealed(null)}
          className="w-full"
        >
          Fechar e voltar pra lista
        </Button>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="floating-panel p-5 space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h3 className="text-base font-semibold">Nova API key</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Pra IA externa plugar via Bearer token. Scopes controlam quais blocos
          ela enxerga.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="key-name">Nome</Label>
        <Input
          id="key-name"
          name="name"
          required
          maxLength={80}
          placeholder="Ex: claude-comercial"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="key-scopes">
          Scopes <span className="text-zinc-400">(opcional, separados por vírgula)</span>
        </Label>
        <Input
          id="key-scopes"
          name="scopes"
          placeholder="public, commercial, client:*"
        />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Bloco entra se TODAS suas tags ∈ scopes. Wildcards:{' '}
          <span className="mono">*</span> (universal),{' '}
          <span className="mono">prefix:*</span> (prefixo). Default-deny.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Button type="submit" variant="brand" disabled={pending} className="w-full">
        {pending ? 'Gerando...' : 'Gerar chave'}
      </Button>
    </form>
  )
}
