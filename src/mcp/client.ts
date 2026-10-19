import type { McpUiResponse } from '../types/ui.ts'

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

export async function invokeMcpTool(tool: string, payload?: Record<string, unknown>): Promise<McpUiResponse> {
  const res = await fetch('/api/mcp/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, payload }),
  })
  const data = await res.json()
  return data.ui as McpUiResponse
}

export async function sendAgentChat(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const res = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  return res.json() as Promise<{
    mode: string
    assistantMessage: string
    ui: McpUiResponse | null
    provider: string | null
    model: string | null
  }>
}

export async function fetchDashboard(): Promise<McpUiResponse> {
  const res = await fetch('/api/dashboard')
  const data = await res.json()
  return data.ui as McpUiResponse
}
