export async function extractText(params: {
  buffer: Buffer
  mimeType: string
}): Promise<string> {
  const { buffer, mimeType } = params
  if (mimeType === 'application/pdf') {
    return extractPdf(buffer)
  }
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8')
  }
  throw new Error(`unsupported_mime: ${mimeType}`)
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { extractText: unpdfExtract, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await unpdfExtract(pdf, { mergePages: true })
  return Array.isArray(text) ? text.join('\n\n') : text
}
