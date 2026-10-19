import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
} from './env.ts'
import { runKeywordAgent } from './mcp/handlers.ts'
import { getPlatform, predictPrompts } from './mcp/platform.ts'
import { tenant } from './mcp/store.ts'
import { dispatchTool, finalizeTurn } from './mcp/turn.ts'
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

app.get('/api/platform', (c) => {
  return c.json({ platform: getPlatform(), suggestions: predictPrompts() })
})

app.post('/api/mcp/invoke', async (c) => {
  const body = await c.req.json<{ tool: string; payload?: Record<string, unknown> }>()
  const result = dispatchTool(body.tool, body.payload)
  return c.json({ ui: result.ui, platform: getPlatform(), suggestions: predictPrompts() })
})

app.post('/api/agent/chat', async (c) => {
  const body = await c.req.json<{ messages: ChatMessage[] }>()
  const messages = body.messages ?? []

  try {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const text = lastUser?.content || ''

    if (!getOpenRouterKey()) {
      const ui = runKeywordAgent(text)
      const turn = finalizeTurn(text, ui)
      return c.json({
        mode: 'offline',
        assistantMessage: turn.platformOnly ? '已透過 platform MCP 更新外殼。' : '（離線演示）已依關鍵字路由。',
        ui: turn.ui,
        platform: turn.platform,
        suggestions: turn.suggestions,
        provider: null,
        model: null,
      })
    }

    const result = await runOpenRouterAgent(messages)
    const turn = finalizeTurn(text, result.ui)
    return c.json({
      mode: 'openrouter',
      assistantMessage: turn.platformOnly ? '已透過 platform MCP 更新外殼。' : result.assistantMessage,
      ui: turn.ui,
      platform: turn.platform,
      suggestions: turn.suggestions,
      provider: result.provider,
      model: result.model,
    })
  } catch (err) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const text = lastUser?.content || ''
    const ui = runKeywordAgent(text)
    const turn = finalizeTurn(text, ui)
    return c.json({
      mode: 'fallback',
      assistantMessage: err instanceof Error ? err.message : 'Agent 失敗，已改用離線路由。',
      ui: turn.ui,
      platform: turn.platform,
      suggestions: turn.suggestions,
      provider: null,
      model: getOpenRouterModel(),
    })
  }
})

const port = Number(process.env.PORT || 8787)
console.log(`API server http://127.0.0.1:${port}`)
serve({ fetch: app.fetch, port })
