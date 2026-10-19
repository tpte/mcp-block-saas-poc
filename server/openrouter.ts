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
import { BUILDER_TOOL_NAMES } from './builder/handlers.ts'
import { builderSystemPromptAddon } from './builder/handlers.ts'
import { classifyTurn, type TurnLane } from './agent/lane.ts'
import { webSearch } from './agent/commonTools.ts'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
}

const builderToolDefs = BUILDER_TOOL_NAMES.map((name) => ({
  type: 'function' as const,
  function: {
    name,
    description:
      name === 'builder:get_setup_context'
        ? '取得工作區打造缺口、建議 Skills、模組現況（客製化後台引導）'
        : name === 'builder:read_skill'
          ? '讀取 builder/skills 下完整 SKILL.md 內容，依內容與使用者對話（非寫死 wizard）'
          : name === 'builder:search_knowledge'
            ? 'RAG 搜尋 builder 知識庫與 skills'
            : name === 'builder:list_templates'
              ? '列出可還原的少數 workspace 預設模板'
              : name === 'builder:apply_template'
                ? '還原模板；confirm=false 時只出確認 UI，true 才寫入 manifest'
                : name === 'builder:preview_manifest'
                  ? '預覽 manifest 變更 diff，不寫入'
                  : '在對話共識後更新 manifest；confirm=false 出確認鈕，true 才寫入',
    parameters: {
      type: 'object',
      properties:
        name === 'builder:read_skill'
          ? { skillId: { type: 'string' } }
          : name === 'builder:search_knowledge'
            ? { query: { type: 'string' }, limit: { type: 'number' } }
            : name === 'builder:apply_template'
              ? { templateId: { type: 'string' }, confirm: { type: 'boolean' } }
              : name === 'builder:preview_manifest' || name === 'builder:update_manifest'
                ? {
                    confirm: { type: 'boolean' },
                    enabledCatalogIds: { type: 'array', items: { type: 'string' } },
                    displayName: { type: 'string' },
                    appendDataSource: { type: 'object' },
                  }
                : {},
      additionalProperties: true,
    },
  },
}))

const commonToolDefs = [
  {
    type: 'function' as const,
    function: {
      name: 'web:search',
      description: '搜尋公開網頁摘要。使用者要查新聞、天氣、人物、最新資訊時才用。',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'util:now',
      description: '台北目前的日期與時間。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'util:calc',
      description: '計算四則運算。expression 只能含數字與 + - * / ( ) %。',
      parameters: {
        type: 'object',
        properties: { expression: { type: 'string' } },
        required: ['expression'],
      },
    },
  },
]

const toolDefs = [
  ...commonToolDefs,
  ...builderToolDefs,
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

function systemFor(lane: TurnLane, systemExtra: string, evidence?: string) {
  if (lane === 'chat') {
    return `${systemExtra}
你是 MATRIX 裡的助手，跟使用者正常說話。寒暄、閒聊、寫一句話，都用簡短繁中直接回答。
不要呼叫工具，不要做報表，不要列假數據，不要用 markdown。`
  }
  if (lane === 'lookup') {
    return `${systemExtra}
你是 MATRIX 裡的助手。用繁中直接回答，不要說「根據摘要」，不要用 markdown。資料不夠就說查不到，不要編造數字。
不要做報表，不要呼叫工作區資料工具。
${evidence ? `\n參考資料：\n${evidence}` : ''}`
  }
  return `${systemExtra}
你是 MATRIX 工作區助手（與 HIYEN MATRIX 無關）。只有使用者明確要看資料、改畫面或打造後台時，才呼叫一個最相關的工具，並用 ${COMPOSE_TOOL} 把結果畫上畫布。
不要為了寒暄一次呼叫多個報表。blocks.kind 只能是 title、points、chart、confirm、diff、document、plan。
需要事實再呼叫 web:search；時間用 util:now；計算用 util:calc。
工作區資料工具：${MCP_TOOL_NAMES.join(', ')}。改外殼用 ${PLATFORM_TOOL}。外部 MCP 用 ${BRIDGE_LIST} / ${BRIDGE_CALL}。
繁中。不要輸出 HTML。`
}

async function complete(
  key: string,
  messages: ChatMessage[],
  provider: ProviderPref,
  tools: typeof toolDefs | null,
  systemExtra: string,
  lane: TurnLane,
  evidence?: string,
) {
  const system: ChatMessage = {
    role: 'system',
    content: systemFor(lane, systemExtra, evidence),
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
      ...(tools ? { tools, tool_choice: 'auto' as const } : {}),
      temperature: lane === 'chat' ? 0.6 : 0.2,
      max_tokens: lane === 'chat' ? 220 : lane === 'lookup' ? 480 : 700,
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
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const lane = classifyTurn(lastUser)
  const tools =
    lane === 'workspace' ? filterToolsForAgent(toolDefs, activeId) : null
  let systemExtra = agent ? `${agent.systemPrompt}\nAgent: ${agent.name} (${agent.kind}).\n` : ''
  if (lane === 'workspace') {
    try {
      systemExtra += `\n${builderSystemPromptAddon()}\n`
    } catch {
      /* session may be unavailable in tests */
    }
  }
  const evidence = lane === 'lookup' ? await webSearch(lastUser) : undefined

  const pinned = getProviderOnly()
  const attempts: ProviderPref[] = [
    { only: pinned, allow_fallbacks: allowProviderFallbacks() },
    { order: pinned, allow_fallbacks: true },
  ]

  let data: Awaited<ReturnType<typeof complete>> | null = null
  let lastError: unknown
  for (const provider of attempts) {
    try {
      data = await complete(key, messages, provider, tools, systemExtra, lane, evidence)
      break
    } catch (err) {
      lastError = err
      if (!retryable(err)) throw err
    }
  }
  if (!data) throw lastError instanceof Error ? lastError : new Error('OpenRouter failed')

  const message = data.choices?.[0]?.message
  if (!message) throw new Error('OpenRouter empty response')

  if (lane !== 'workspace') {
    const text = message.content?.trim() || evidence || '我在，再說一次你想問的。'
    return {
      assistantMessage: text,
      ui: null,
      trace: [] as ToolTraceEntry[],
      provider: data.provider ?? null,
      model: getOpenRouterModel(),
    }
  }

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
