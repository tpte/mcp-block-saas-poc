import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
} from './env.ts'
import { explainCapability } from './mcp/bridge.ts'
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
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const text = lastUser?.content || ''

  return streamSSE(c, async (stream) => {
    const status = (line: string) => stream.writeSSE({ event: 'status', data: JSON.stringify({ text: line }) })
    const finish = (payload: Record<string, unknown>) =>
      stream.writeSSE({ event: 'done', data: JSON.stringify(payload) })

    await status('已收到問題')
    const explained = explainCapability(text)
    if (explained) {
      await status('這題在問已掛載的 MCP，直接讀工具清單')
      const turn = finalizeTurn(text, explained)
      await status('正在把能力說明畫上畫布')
      await finish({
        mode: 'bridge',
        assistantMessage: '已說明掛載的 MCP 能做什麼。',
        ui: turn.ui,
        platform: turn.platform,
        suggestions: turn.suggestions,
        provider: null,
        model: null,
      })
      return
    }

    await status('正在交給模型')
    let ticks = 0
    const timer = setInterval(() => {
      ticks += 1
      void status(`模型仍在思考（${ticks} 秒）`)
    }, 1000)

    try {
      if (!getOpenRouterKey()) {
        clearInterval(timer)
        await status('沒有 OpenRouter key，改走本機 MCP')
        const turn = finalizeTurn(text, runKeywordAgent(text))
        await finish({
          mode: 'offline',
          assistantMessage: '已用本機 MCP 回答。',
          ui: turn.ui,
          platform: turn.platform,
          suggestions: turn.suggestions,
          provider: null,
          model: null,
        })
        return
      }

      const result = await runOpenRouterAgent(messages)
      clearInterval(timer)
      await status(result.provider ? `模型已回覆，上游是 ${result.provider}` : '模型已回覆')
      const turn = finalizeTurn(text, result.ui)
      await status('正在把回覆分塊畫上畫布')
      await finish({
        mode: 'openrouter',
        assistantMessage: result.assistantMessage,
        ui: turn.ui,
        platform: turn.platform,
        suggestions: turn.suggestions,
        provider: result.provider,
        model: result.model,
      })
    } catch (err) {
      clearInterval(timer)
      await status('模型沒有順利回完，改用本機 MCP')
      const turn = finalizeTurn(text, runKeywordAgent(text))
      await finish({
        mode: 'fallback',
        assistantMessage: '模型暫時忙碌，已用本機 MCP 完成這一步。',
        ui: turn.ui,
        platform: turn.platform,
        suggestions: turn.suggestions,
        provider: null,
        model: getOpenRouterModel(),
        error: err instanceof Error ? err.message : 'failed',
      })
    }
  })
})

const port = Number(process.env.PORT || 8787)
console.log(`API server http://127.0.0.1:${port}`)
serve({ fetch: app.fetch, port })
