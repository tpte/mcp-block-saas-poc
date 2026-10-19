export type ToolTraceEntry = {
  tool: string
  payload?: Record<string, unknown>
  source: 'invoke' | 'chat'
  mode?: 'openrouter' | 'offline' | 'fallback' | 'bridge'
  provider?: string | null
  durationMs: number
  ok: boolean
  error?: string
}
