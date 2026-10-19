import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
} from './env.ts'
import { dashboardHome, invokeMcpTool, runKeywordAgent } from './mcp/handlers.ts'
import { tenant } from './mcp/store.ts'
import { runOpenRouterAgent, type ChatMessage } from './openrouter.ts'

const app = new Hono()

app.use('/api/*', cors())

app.get('/api/health', (c) => {
  const key = getOpenRouterKey()
  return c.json({
    ok: true,
    tenant,
    openRouterConfigured: Boolean(key),
    model: getOpenRouterModel(),
    providerOnly: getProviderOnly(),
    allowFallbacks: allowProviderFallbacks(),
  })
})

app.post('/api/mcp/invoke', async (c) => {
  const body = await c.req.json<{ tool: string; payload?: Record<string, unknown> }>()
  const ui = invokeMcpTool(body.tool, body.payload)
  return c.json({ ui })
})

app.post('/api/agent/chat', async (c) => {
  const body = await c.req.json<{ messages: ChatMessage[] }>()
  const messages = body.messages ?? []

  try {
    if (!getOpenRouterKey()) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      const ui = runKeywordAgent(lastUser?.content || '')
      return c.json({
        mode: 'offline',
        assistantMessage: '（離線演示）已依關鍵字路由至 mock MCP。',
        ui,
        provider: null,
        model: null,
      })
    }

    const result = await runOpenRouterAgent(messages)
    return c.json({
      mode: 'openrouter',
      assistantMessage: result.assistantMessage,
      ui: result.ui,
      provider: result.provider,
      model: result.model,
    })
  } catch (err) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const ui = runKeywordAgent(lastUser?.content || '')
    return c.json({
      mode: 'fallback',
      assistantMessage: err instanceof Error ? err.message : 'Agent 失敗，已改用離線路由。',
      ui,
      provider: null,
      model: getOpenRouterModel(),
    })
  }
})

app.get('/api/dashboard', (c) => {
  return c.json({ ui: { action: 'RENDER', ui: dashboardHome() } })
})

const port = Number(process.env.PORT || 8787)
console.log(`API server http://127.0.0.1:${port}`)
serve({ fetch: app.fetch, port })
