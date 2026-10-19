import type { PlatformConfig } from '../../shared/platform.ts'
import type { McpUiResponse } from '../types/ui.ts'

export type { PlatformConfig }

export type HealthInfo = {
  ok: boolean
  tenant: { name: string; user: string; role: string }
  openRouterConfigured: boolean
  model: string
  providerOnly: string[]
  allowFallbacks: boolean
}

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error('health failed')
  return res.json()
}

export async function fetchPlatform(): Promise<{ platform: PlatformConfig; suggestions: string[] }> {
  const res = await fetch('/api/platform')
  if (!res.ok) throw new Error('platform failed')
  return res.json()
}

export async function invokeMcpTool(tool: string, payload?: Record<string, unknown>) {
  const res = await fetch('/api/mcp/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, payload }),
  })
  return res.json() as Promise<{ ui: McpUiResponse | null; platform: PlatformConfig; suggestions: string[] }>
}

export type AgentChatResult = {
  mode: string
  assistantMessage: string
  ui: McpUiResponse | null
  platform: PlatformConfig
  suggestions: string[]
  provider: string | null
  model: string | null
}

export async function sendAgentChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onStatus?: (text: string) => void,
): Promise<AgentChatResult> {
  const res = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.body) throw new Error('沒有串流')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: AgentChatResult | null = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.+)$/m)?.[1] ?? 'message'
      const data = chunk.match(/^data: (.+)$/m)?.[1]
      if (!data) continue
      const payload = JSON.parse(data) as { text?: string } & AgentChatResult
      if (event === 'status' && payload.text) onStatus?.(payload.text)
      if (event === 'done') result = payload
    }
  }

  if (!result) throw new Error('串流沒有結束')
  return result
}

export async function fetchDashboard(): Promise<McpUiResponse> {
  const res = await fetch('/api/dashboard')
  const data = await res.json()
  return data.ui as McpUiResponse
}
