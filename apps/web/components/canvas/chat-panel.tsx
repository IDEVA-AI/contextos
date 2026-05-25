'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle,
  Send,
  Trash2,
  X,
  Sparkles,
  Bot,
  User as UserIcon,
  Loader2
} from 'lucide-react'

type Role = 'user' | 'assistant'

type ChatMessage = {
  role: Role
  content: string
  meta?: {
    provider?: string
    model?: string
    trace_id?: string
    tokens?: number
    blocks_included?: number
  }
}

type Props = {
  brainId: string
  brainName: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChatPanel({ brainId, brainName, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = onOpenChange !== undefined
  const open = isControlled ? !!controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange(v)
    else setInternalOpen(v)
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll quando mensagem nova chega
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Auto-focus no input quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  async function send() {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/brains/${brainId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data?.message ?? data?.error ?? `HTTP ${res.status}`
        setError(msg)
        // remove a user message que falhou pra deixar limpo
        return
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        meta: {
          provider: data.provider,
          model: data.model,
          trace_id: data.trace_id,
          tokens: data.package_stats?.tokensEstimated,
          blocks_included: data.package_stats?.blocksIncluded
        }
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="floating-panel absolute top-4 right-[27rem] z-20 px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 transition-colors"
          title="Chat"
        >
          <MessageCircle className="w-3 h-3 inline mr-1.5" />
          Chat
        </button>
      )}

      {open && (
        <aside className="floating-panel absolute top-4 right-4 z-30 w-[28rem] max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: '#C5F43233', color: '#0a0a0a' }}
              >
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight truncate">
                  Chat com cérebro
                </div>
                <div className="mono text-[9px] text-zinc-400 leading-tight truncate">
                  {brainName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50/40"
          >
            {messages.length === 0 && !error && (
              <EmptyState brainName={brainName} />
            )}

            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 pl-9">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>compilando contexto + chamando modelo...</span>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                <span className="font-medium">Erro:</span> {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-100 p-2 flex-shrink-0 bg-white">
            <div className="flex items-end gap-1.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunta pro cérebro..."
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs leading-snug focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  background: input.trim() && !loading ? '#C5F432' : '#e4e4e7'
                }}
                title="Enviar (Enter)"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[9px] text-zinc-400">
                Enter pra enviar · Shift+Enter pra quebrar linha
              </span>
              <span className="text-[9px] text-zinc-400 mono">
                {messages.length} {messages.length === 1 ? 'turno' : 'turnos'}
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}

function EmptyState({ brainName }: { brainName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: '#C5F43222' }}
      >
        <Sparkles className="w-5 h-5" style={{ color: '#0a0a0a' }} strokeWidth={2} />
      </span>
      <p className="text-xs font-medium text-zinc-700 mb-1">
        Conversa com <span style={{ color: '#0a0a0a' }}>{brainName}</span>
      </p>
      <p className="text-[11px] text-zinc-500 max-w-[18rem] leading-relaxed">
        Cada pergunta compila contexto fresh do cérebro e chama o modelo. Histórico vai
        embora ao fechar.
      </p>
      <div className="mt-4 space-y-1.5 text-left w-full max-w-[18rem]">
        <div className="text-[9px] uppercase tracking-wider text-zinc-400 mono">
          Sugestões
        </div>
        <Suggestion text="Como devo responder um lead novo no WhatsApp?" />
        <Suggestion text="Gera 3 hooks pra Reels sobre nosso produto" />
        <Suggestion text="Qual o tom de voz pra resposta técnica?" />
      </div>
    </div>
  )
}

function Suggestion({ text }: { text: string }) {
  return (
    <div className="text-[10px] text-zinc-500 px-2 py-1 rounded bg-white border border-zinc-100 leading-relaxed">
      "{text}"
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] flex flex-col items-end gap-1">
          <div
            className="text-xs leading-relaxed px-3 py-2 rounded-lg rounded-br-sm text-zinc-900 whitespace-pre-wrap"
            style={{ background: '#C5F432' }}
          >
            {message.content}
          </div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-400">
            <UserIcon className="w-2.5 h-2.5" />
            <span>você</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] flex flex-col items-start gap-1">
        <div className="text-xs leading-relaxed px-3 py-2 rounded-lg rounded-bl-sm bg-white border border-zinc-200 text-zinc-800 whitespace-pre-wrap">
          {message.content}
        </div>
        {message.meta && (
          <div className="flex items-center gap-2 text-[9px] text-zinc-400 mono tabular-nums px-1">
            <span className="flex items-center gap-1">
              <Bot className="w-2.5 h-2.5" />
              {message.meta.model ?? message.meta.provider}
            </span>
            {message.meta.tokens != null && (
              <span>{message.meta.tokens}t</span>
            )}
            {message.meta.blocks_included != null && (
              <span>{message.meta.blocks_included} blocos</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
