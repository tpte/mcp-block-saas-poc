import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
  getSiteUrl,
} from './env.ts'
import { MCP_TOOL_NAMES } from './mcp/handlers.ts'
import { mergeUi, speechToBlocks } from './mcp/compose.ts'
import { filterToolsForAgent } from './agents/policy.ts'
import { getAgent } from './db/store.ts'
import { getSession } from './requestContext.ts'
import {
  AGENT_DELEGATE,
  BRIDGE_CALL,
  BRIDGE_LIST,
  COMPOSE_TOOL,
  dispatchToolWithTrace,
  PLATFORM_TOOL,
} from './mcp/turn.ts'
import type { ToolTraceEntry } from '../shared/trace.ts'

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
      name: COMPOSE_TOOL,
      description:
        'Render the reply on the canvas as typed blocks. Always call this for the user-visible answer. kinds: title, points, chart, confirm, diff, document, plan.',
      parameters: {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['title', 'points', 'chart', 'confirm', 'diff', 'document', 'plan'] },
                text: { type: 'string' },
                title: { type: 'string' },
                items: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
                chartType: { type: 'string', enum: ['bar', 'line'] },
                series: { type: 'array', items: { type: 'object' } },
                actions: { type: 'array', items: { type: 'object' } },
                before: { type: 'string' },
                after: { type: 'string' },
                body: { type: 'string' },
                steps: { type: 'array', items: { type: 'object' } },
              },
              required: ['kind'],
            },
          },
        },
        required: ['blocks'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: BRIDGE_LIST,
      description: 'List external MCPs mounted behind the bridge MCP.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: BRIDGE_CALL,
      description: 'Call a tool on a mounted external MCP. The bridge adapts raw JSON into canvas blocks.',
      parameters: {
        type: 'object',
        properties: {
          server: { type: 'string' },
          tool: { type: 'string' },
          args: { type: 'object' },
        },
        required: ['server', 'tool'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: AGENT_DELEGATE,
      description: 'Delegate a task to another agent in this workspace (orchestrator only).',
      parameters: {
        type: 'object',
        properties: {
          targetAgentId: { type: 'string' },
          task: { type: 'string' },
        },
        required: ['targetAgentId', 'task'],
      },
    },
  },
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
          moduleSidebarEnabled: { type: 'boolean' },
          modulePillsEnabled: { type: 'boolean' },
          commandPaletteEnabled: { type: 'boolean' },
          showToolTrace: { type: 'boolean' },
          layoutPreferences: {
            type: 'object',
            properties: {
              blockSort: { type: 'string', enum: ['agent', 'importance', 'type'] },
              defaultCanvasLayout: { type: 'string', enum: ['stack', 'grid', 'hero'] },
              emphasis: { type: 'string', enum: ['summary-first', 'actions-first'] },
            },
          },
        },
      },
    },
  },
]

type ProviderPref =
  | { only: string[]; allow_fallbacks: boolean }
  | { order: string[]; allow_fallbacks: boolean }

async function complete(
  key: string,
  messages: ChatMessage[],
  provider: ProviderPref,
  tools: typeof toolDefs,
  systemExtra: string,
) {
  const system: ChatMessage = {
    role: 'system',
    content: `${systemExtra}
你是 MATRIX 超級 Agent（個人 MCP 駕駛艙；與 HIYEN MATRIX 無關）。使用者看得到的每句話都必須經 ${COMPOSE_TOOL} 畫在畫布上，不要只回純文字。
blocks.kind 只能是 title、points、chart、confirm、diff、document、plan。
一般對話一定要有 title，加上至少 3 個 points，每點寫完整一句，不要只回標題或一個詞。問某個 MCP 能做什麼時，先講它的 tools 與限制，再給 confirm。要圖用 chart，要按鈕用 confirm，比對用 diff，長文用 document，步驟用 plan。
需要資料時再呼叫：${MCP_TOOL_NAMES.join(', ')}。改外殼用 ${PLATFORM_TOOL}。外部 MCP 用 ${BRIDGE_LIST} / ${BRIDGE_CALL}。
可同時呼叫資料 tool 與 ${COMPOSE_TOOL}。compose 的 blocks 依使用者問題決定種類與順序（先給最該先懂的一塊），可附 priority／role／collapsible。勿機械固定 alert→table。
繁中。不要輸出 HTML。`,
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': getSiteUrl(),
      'X-Title': 'MATRIX MCP Cockpit',
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [system, ...messages.filter((m) => m.role !== 'system')],
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
      provider,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; code?: number }
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
    const err = new Error(`OpenRouter ${res.status}: ${msg}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return data
}

function retryable(err: unknown) {
  const status = (err as { status?: number }).status
  return status === 429 || status === 502 || status === 503 || status === 529
}

export async function runOpenRouterAgent(messages: ChatMessage[], agentId?: string) {
  const key = getOpenRouterKey()
  if (!key) throw new Error('OPENROUTER_API_KEY missing')

  const activeId = agentId ?? getSession().activeAgentId
  const agent = getAgent(activeId)
  const tools = filterToolsForAgent(toolDefs, activeId)
  const systemExtra = agent ? `${agent.systemPrompt}\nAgent: ${agent.name} (${agent.kind}).\n` : ''

  const pinned = getProviderOnly()
  const attempts: ProviderPref[] = [
    { only: pinned, allow_fallbacks: allowProviderFallbacks() },
    { order: pinned, allow_fallbacks: true },
  ]

  let data: Awaited<ReturnType<typeof complete>> | null = null
  let lastError: unknown
  for (const provider of attempts) {
    try {
      data = await complete(key, messages, provider, tools, systemExtra)
      break
    } catch (err) {
      lastError = err
      if (!retryable(err)) throw err
    }
  }
  if (!data) throw lastError instanceof Error ? lastError : new Error('OpenRouter failed')

  const message = data.choices?.[0]?.message
  if (!message) throw new Error('OpenRouter empty response')

  let ui = null as ReturnType<typeof dispatchToolWithTrace>['ui']
  const trace: ToolTraceEntry[] = []
  let composed = false
  const provider = data.provider ?? null
  for (const call of message.tool_calls ?? []) {
    let payload: Record<string, unknown> | undefined
    try {
      payload = call.function.arguments ? JSON.parse(call.function.arguments) : undefined
    } catch {
      payload = undefined
    }
    if (call.function.name === COMPOSE_TOOL) composed = true
    const result = await dispatchToolWithTrace(call.function.name, payload, {
      source: 'chat',
      mode: 'openrouter',
      provider,
    })
    trace.push(...result.trace)
    ui = mergeUi(ui, result.ui)
  }
  if (!composed && message.content?.trim()) ui = mergeUi(speechToBlocks(message.content), ui)

  return {
    assistantMessage: message.content?.trim() || (ui ? '已為你更新工作畫面。' : '請再描述一下需求。'),
    ui,
    trace,
    provider,
    model: getOpenRouterModel(),
  }
}
