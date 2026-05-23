import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServerForAuth } from '@/lib/mcp-server'
import { authenticateV1Request } from '@/lib/v1-auth'

export const runtime = 'nodejs'

async function handle(req: Request): Promise<Response> {
  const auth = await authenticateV1Request(req)
  if (!auth) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 })
  }
  if (!auth.workspaceId) {
    // MCP requer API key scoped a workspace (não funciona com session cookie sem workspace)
    return Response.json(
      { error: 'mcp_requires_api_key_scoped_to_workspace' },
      { status: 403 }
    )
  }

  // Stateless mode: cria server + transport por request
  const server = createMcpServerForAuth(auth)
  const transport = new WebStandardStreamableHTTPServerTransport({
    // sessionIdGenerator undefined = stateless
  })

  await server.connect(transport)
  // Não usar finally close — handleRequest retorna ReadableStream que precisa
  // ficar aberto até o client terminar de ler. Garbage collect cuida do resto.
  return transport.handleRequest(req)
}

export const GET = handle
export const POST = handle
export const DELETE = handle
