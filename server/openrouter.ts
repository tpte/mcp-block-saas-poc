import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
  getSiteUrl,
} from './env.ts'
import { MCP_TOOL_NAMES } from './mcp/handlers.ts'
import { dispatchTool, PLATFORM_TOOL } from './mcp/turn.ts'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
}

const toolDefs = [
  ...MCP_TOOL_NAMES.map((name) => ({
    type: 'function' as const,
    function: {
      name,
      description: `Invoke MCP tool ${name} and return UI blocks for the canvas.`,
      parameters: { type: 'object', properties: {}, additionalProperties: true },
    },
  })),
  {
    type: 'function' as const,
    function: {
      name: PLATFORM_TOOL,
      description:
        'MCP that customizes the shell itself: theme, composer position/width/placeholder, next-prompt count, header, canvas width. Does not replace canvas data.',
      parameters: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'] },
          composerPosition: { type: 'string', enum: ['bottom', 'top'] },
          composerWidth: { type: 'string', enum: ['narrow', 'wide'] },
          placeholder: { type: 'string' },
          showHistory: { type: 'boolean' },
          suggestionsEnabled: { type: 'boolean' },
          suggestionCount: { type: 'number' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          canvasMaxWidth: { type: 'string', enum: ['md', 'xl', 'full'] },
          density: { type: 'string', enum: ['comfortable', 'compact'] },
          showModelBadge: { type: 'boolean' },
        },
      },
    },
  },
]

export async function runOpenRouterAgent(messages: ChatMessage[]) {
  const key = getOpenRouterKey()
  if (!key) throw new Error('OPENROUTER_API_KEY missing')

  const system: ChatMessage = {
    role: 'system',
    content: `你是 Super MCP 平台的 Orchestrator。畫布資料與平台外殼都透過 MCP 修改。
看資料用業務 tools：${MCP_TOOL_NAMES.join(', ')}。
改外殼（深色、對話框位置與寬度、下一句預測數量與開關、標題、畫布寬度）用 ${PLATFORM_TOOL}。
若使用者同時要看資料又要改外殼，兩個 tool 都要呼叫。
不要輸出 HTML。回覆用一句繁中。`,
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

  let ui = null as ReturnType<typeof dispatchTool>['ui']
  for (const call of message.tool_calls ?? []) {
    let payload: Record<string, unknown> | undefined
    try {
      payload = call.function.arguments ? JSON.parse(call.function.arguments) : undefined
    } catch {
      payload = undefined
    }
    const result = dispatchTool(call.function.name, payload)
    if (result.ui) ui = result.ui
  }

  return {
    assistantMessage: message.content?.trim() || (ui ? '已為你更新工作畫面。' : '請再描述一下需求。'),
    ui,
    provider: data.provider ?? null,
    model: getOpenRouterModel(),
  }
}
