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
    platform: PlatformConfig
    suggestions: string[]
    provider: string | null
    model: string | null
  }>
}

export async function fetchDashboard(): Promise<McpUiResponse> {
  const res = await fetch('/api/dashboard')
  const data = await res.json()
  return data.ui as McpUiResponse
}
