export type Chunk = {
  index: number
  content: string
  estimatedTokens: number
}

// Estimativa simples: 1 token ≈ 4 caracteres em inglês, ~3 em pt-BR
const CHARS_PER_TOKEN = 3.5

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Split por parágrafo (linha vazia), depois reagrupa parágrafos
 * até atingir aproximadamente `maxTokens` por chunk.
 */
export function chunkText(text: string, maxTokens = 500): Chunk[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  // Quebra em parágrafos
  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const chunks: Chunk[] = []
  let buffer: string[] = []
  let bufferTokens = 0

  function flush() {
    if (buffer.length === 0) return
    const content = buffer.join('\n\n').trim()
    if (content) {
      chunks.push({
        index: chunks.length,
        content,
        estimatedTokens: estimateTokens(content)
      })
    }
    buffer = []
    bufferTokens = 0
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para)

    // Parágrafo único maior que maxTokens — split por sentença
    if (paraTokens > maxTokens) {
      flush()
      const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.trim())
      for (const sentence of sentences) {
        const sentTokens = estimateTokens(sentence)
        if (bufferTokens + sentTokens > maxTokens && buffer.length > 0) {
          flush()
        }
        buffer.push(sentence)
        bufferTokens += sentTokens
      }
      flush()
      continue
    }

    if (bufferTokens + paraTokens > maxTokens && buffer.length > 0) {
      flush()
    }
    buffer.push(para)
    bufferTokens += paraTokens
  }
  flush()

  return chunks
}
