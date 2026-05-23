'use client'

import { useEffect, useRef, useState } from 'react'
import { saveBrainStateAction } from '@/app/actions/canvas'
import type { CanvasEdge, CanvasNode } from '@/lib/node'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type Options = {
  brainId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  debounceMs?: number
}

export function useAutoSave({
  brainId,
  nodes,
  edges,
  debounceMs = 2000
}: Options): { status: SaveStatus; lastSavedAt: Date | null } {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }

    setStatus('dirty')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (pendingRef.current) {
        // Re-trigger after current save finishes
        return
      }
      pendingRef.current = true
      setStatus('saving')

      const payload = {
        brainId,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: (n.type ?? 'context_block') as
            | 'context_block'
            | 'persona'
            | 'rule'
            | 'memory'
            | 'document'
            | 'knowledge'
            | 'output_template',
          title: n.data.title,
          content: n.data.content,
          priority: n.data.priority,
          scope: n.data.scope,
          tags: n.data.tags,
          mode: n.data.mode,
          enabled: n.data.enabled,
          positionX: Math.round(n.position.x),
          positionY: Math.round(n.position.y),
          metadata: n.data.metadata
        })),
        edges: edges.map((e) => ({
          id: e.id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          label: (e.label as string | undefined) ?? null
        }))
      }

      try {
        const result = await saveBrainStateAction(payload)
        if (result.ok) {
          setStatus('saved')
          setLastSavedAt(new Date(result.savedAt))
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      } finally {
        pendingRef.current = false
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [brainId, nodes, edges, debounceMs])

  return { status, lastSavedAt }
}
