import type { McpUiResponse, TableRow, UiBlock } from '../../shared/ui.ts'
import { composeCanvas } from './compose.ts'
import { sampleNotesMcp, type ExternalMcp } from './external/sampleNotes.ts'

const mounts = new Map<string, ExternalMcp>()

export function mountExternalMcp(server: ExternalMcp) {
  mounts.set(server.name, server)
}

mountExternalMcp(sampleNotesMcp)

export function explainCapability(raw: string): McpUiResponse | null {
  const text = raw.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  if (!/(可以|能干|能做|幹嘛|幹麻|是什麼|用途|做什麼)/.test(text)) return null
  if (!/notes|筆記|外部 mcp|掛載/i.test(text)) return null
  const tools = [...mounts.values()].flatMap((server) =>
    server.listTools().map((tool) => `${server.name} · ${tool.name}：${tool.description}`),
  )
  return composeCanvas({
    blocks: [
      { kind: 'title', text: '外部 notes MCP 可以做這些事' },
      {
        kind: 'points',
        items: [
          '它是掛在 Bridge 後面的外部 MCP，自己不會畫畫面，只回 JSON。',
          ...tools,
          'notes:list 會把現有記事交回來，Bridge 轉成表格。',
          'notes:add 用 title、body 新增一則記事，再把整份清單交回來。',
          '你問「可以幹麻」時不需要先把資料表整頁換掉，先看能力，再決定要不要讀。',
        ],
      },
      {
        kind: 'confirm',
        title: '要現在讀出記事嗎？',
        description: '按下去會呼叫 notes:list，結果一樣畫在這塊畫布上。',
        actions: [{ label: '讀取 notes', mcpTool: 'bridge:call', payload: { server: 'notes', tool: 'notes:list' } }],
      },
    ],
  })
}

export function listMountedMcps(): McpUiResponse {
  const rows: TableRow[] = []
  for (const server of mounts.values()) {
    for (const tool of server.listTools()) {
      rows.push({ id: `${server.name}:${tool.name}`, server: server.name, tool: tool.name, description: tool.description })
    }
  }
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnAlertBlock',
          blockId: 'bridge-explain',
          props: {
            title: 'Bridge MCP',
            description: '外部 MCP 只回原始資料。這一層把它包成平台 Block，外部不用認識我們的 UI。',
          },
        },
        {
          type: 'block',
          component: 'ShadcnDataTableBlock',
          blockId: 'bridge-tools',
          props: {
            title: '已掛載的外部 MCP',
            columns: [
              { key: 'server', label: 'MCP' },
              { key: 'tool', label: 'Tool' },
              { key: 'description', label: '說明' },
            ],
            data: rows,
            actions: [{ label: '讀取 notes', mcpTool: 'bridge:call', payload: { server: 'notes', tool: 'notes:list' } }],
          },
        },
      ],
    },
  }
}

export function callMountedMcp(serverName: string, tool: string, args: Record<string, unknown> = {}): McpUiResponse {
  const server = mounts.get(serverName)
  if (!server) {
    return alertBlock(`找不到外部 MCP：${serverName}`)
  }
  try {
    const raw = server.callTool(tool, args)
    return { action: 'RENDER', ui: adaptToBlock(serverName, tool, raw) }
  } catch (err) {
    return alertBlock(err instanceof Error ? err.message : '外部 MCP 呼叫失敗')
  }
}

function adaptToBlock(serverName: string, tool: string, raw: unknown): UiBlock {
  if (isUiBlock(raw)) return raw
  if (Array.isArray(raw) && raw.every((row) => row && typeof row === 'object')) {
    const rows = raw as Record<string, unknown>[]
    const keys = Object.keys(rows[0] ?? { value: '' })
    return {
      type: 'block',
      component: 'ShadcnDataTableBlock',
      blockId: `ext-${serverName}-${tool}`,
      props: {
        title: `${serverName} · ${tool}`,
        description: '由 Bridge MCP 從外部 JSON 轉成表格',
        columns: keys.map((key) => ({ key, label: key })),
        data: rows.map((row, index) => {
          const flat: TableRow = { id: index + 1 }
          for (const key of keys) flat[key] = stringifyCell(row[key])
          return flat
        }),
      },
    }
  }
  return {
    type: 'block',
    component: 'ShadcnAlertBlock',
    blockId: `ext-${serverName}-${tool}`,
    props: {
      title: `${serverName} · ${tool}`,
      description: JSON.stringify(raw).slice(0, 500),
    },
  }
}

function alertBlock(description: string): McpUiResponse {
  return {
    action: 'RENDER',
    ui: {
      type: 'block',
      component: 'ShadcnAlertBlock',
      blockId: 'bridge-error',
      props: { variant: 'warning', title: 'Bridge MCP', description },
    },
  }
}

function isUiBlock(value: unknown): value is UiBlock {
  return Boolean(value && typeof value === 'object' && (value as UiBlock).type === 'block' && (value as UiBlock).component)
}

function stringifyCell(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value == null) return ''
  return JSON.stringify(value)
}
