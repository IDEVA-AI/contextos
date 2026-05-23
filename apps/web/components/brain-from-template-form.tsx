'use client'

import { useFormStatus } from 'react-dom'
import { createBrainFromTemplateAction } from '@/app/actions/template'
import { TEMPLATES } from '@/lib/templates'

export function BrainFromTemplateForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={createBrainFromTemplateAction}
      className="border-t border-zinc-100 pt-2 mt-1 flex items-center gap-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="templateId"
        defaultValue=""
        className="flex-1 h-7 rounded-md border border-zinc-200 bg-white px-2 text-[11px]"
        required
      >
        <option value="" disabled>
          ou cria de um template…
        </option>
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id} title={t.description}>
            {t.name}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-7 px-3 rounded-md bg-zinc-900 text-white text-[11px] font-medium disabled:opacity-50"
    >
      {pending ? '...' : 'criar'}
    </button>
  )
}
