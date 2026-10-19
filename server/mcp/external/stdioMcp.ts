import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { getStdioServerConfigs, type StdioServerConfig } from '../../env.ts'
import { mountExternalMcp } from '../bridge.ts'

type Session = {
  client: Client
  config: StdioServerConfig
}

const sessions = new Map<string, Session>()

function parseToolResult(result: Awaited<ReturnType<Client['callTool']>>) {
  if (result.content?.length) {
    const text = result.content
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text: string }).text)
      .join('\n')
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  return result.structuredContent ?? result
}

export async function mountStdioFromEnv() {
  const configs = getStdioServerConfigs()
  for (const config of configs) {
    if (sessions.has(config.name)) {
      console.warn(`stdio MCP 名稱重複，略過：${config.name}`)
      continue
    }
    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
        env: config.env,
      })
      const client = new Client({ name: 'matrix-mcp-bridge', version: '0.0.1' }, { capabilities: {} })
      await client.connect(transport)
      sessions.set(config.name, { client, config })
      const listed = await client.listTools()
      const tools = listed.tools ?? []
      const serverName = config.name
      mountExternalMcp({
        name: serverName,
        description: `stdio MCP (${config.command})`,
        listTools: () =>
          tools.map((tool) => ({
            name: tool.name,
            description: tool.description ?? '',
          })),
        callTool: (tool, args) =>
          client.callTool({ name: tool, arguments: args }).then((result) => parseToolResult(result)),
      })
      console.log(`stdio MCP mounted: ${config.name}`)
    } catch (err) {
      console.warn(`stdio MCP 掛載失敗 (${config.name}):`, err instanceof Error ? err.message : err)
    }
  }
}
