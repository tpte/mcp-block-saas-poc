import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
  getSiteUrl,
} from './env.ts'
import { invokeMcpTool, MCP_TOOL_NAMES } from './mcp/handlers.ts'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
}

const toolDefs = MCP_TOOL_NAMES.map((name) => ({
  type: 'function' as const,
  function: {
    name,
    description: `Invoke MCP tool ${name} and return UI blocks for the tenant workspace.`,
    parameters: { type: 'object', properties: {}, additionalProperties: true },
  },
}))

export async function runOpenRouterAgent(messages: ChatMessage[]) {
  const key = getOpenRouterKey()
  if (!key) throw new Error('OPENROUTER_API_KEY missing')

  const system: ChatMessage = {
    role: 'system',
    content: `你是 Super MCP 平台的 Orchestrator。平台不綁定特定公司產品，任何已掛載的 MCP 都能驅動整頁畫布。
使用者用繁體中文描述想看的內容時，選擇最合適的 tool，前端會整頁重繪（圖表、表格、看板依 tool 回傳的 layout）。
可用 tools：${MCP_TOOL_NAMES.join(', ')}。
規則：一次只呼叫一個 tool；不要輸出 HTML；回覆用一句繁中說明畫布更新了什麼。`,
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': getSiteUrl(),
      'X-Title': 'MCP Block SaaS MVP',
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [system, ...messages.filter((m) => m.role !== 'system')],
      tools: toolDefs,
      tool_choice: 'auto',
      temperature: 0.2,
      provider: {
        only: getProviderOnly(),
        allow_fallbacks: allowProviderFallbacks(),
      },
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    provider?: string
    choices?: Array<{
      message?: {
        role: string
        content?: string | null
        tool_calls?: Array<{
          id: string
          function: { name: string; arguments: string }
        }>
      }
    }>
  }

  if (!res.ok) {
    const msg = data.error?.message || res.statusText
    throw new Error(`OpenRouter ${res.status}: ${msg}`)
  }

  const message = data.choices?.[0]?.message
  if (!message) throw new Error('OpenRouter empty response')

  let ui = null as ReturnType<typeof invokeMcpTool> | null
  const toolCalls = message.tool_calls ?? []

  if (toolCalls.length > 0) {
    const call = toolCalls[0]
    let payload: Record<string, unknown> | undefined
    try {
      payload = call.function.arguments ? JSON.parse(call.function.arguments) : undefined
    } catch {
      payload = undefined
    }
    ui = invokeMcpTool(call.function.name, payload)
  }

  return {
    assistantMessage: message.content?.trim() || (ui ? '已為你更新工作畫面。' : '請再描述一下需求。'),
    ui,
    provider: data.provider ?? null,
    model: getOpenRouterModel(),
  }
}
