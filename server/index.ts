import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { approveBlockPackage, listPackagesForWorkspace, submitBlockPackage } from './blocks/packages.ts'
import { sessionFromHeaders } from './context.ts'
import {
  allowProviderFallbacks,
  getOpenRouterKey,
  getOpenRouterModel,
  getProviderOnly,
} from './env.ts'
import { buildMcpCatalog } from './mcp/catalog.ts'
import { loadManifest } from './workspaces/manifest.ts'
import { registerWorkspaceRoutes } from './workspaces/routes.ts'
import { registerBuilderRoutes } from './builder/routes.ts'
import { explainCapability } from './mcp/bridge.ts'
import { mountStdioFromEnv } from './mcp/external/stdioMcp.ts'
import { runKeywordAgent } from './mcp/handlers.ts'
import { getPlatform, predictPrompts } from './mcp/platform.ts'
import { chatFallback, classifyTurn, localAnswer } from './agent/lane.ts'
import { llmPredictSuggestions } from './suggestions/llmPrompts.ts'
import { dispatchToolWithTrace, finalizeTurn } from './mcp/turn.ts'
import { getRunTree, listAgents, listRecentRuns, listUsers, resolveSession } from './db/store.ts'
import { listUsersInWorkspace, sessionCapabilities } from './workspaces/rbac.ts'
import { runOpenRouterAgent, type ChatMessage } from './openrouter.ts'
import { runWithSession } from './requestContext.ts'
import { logAssistantReply, logFeedback, logToolInvoke, logUserMessage } from './ops/record.ts'
import { readOpLogEntries, summarizeOpLog } from './ops/logStore.ts'
import { buildTopologyTree, newRunId, persistTrace } from './runs/runTree.ts'
import { storageList } from './storage/workspaceStorage.ts'
import { DEFAULT_QUOTES, BILLING_SPEC_VERSION } from '../shared/billing.ts'
import {
  PRODUCT_CODE,
  PRODUCT_DISCLAIMER,
  PRODUCT_NAME,
  PRODUCT_NOT_HIYEN_LABEL,
} from '../shared/product.ts'

const app = new Hono()

app.use('/api/*', cors())
app.use('/api/*', async (c, next) => {
  const session = sessionFromHeaders(c)
  await runWithSession(session, () => next())
})

registerWorkspaceRoutes(app)
registerBuilderRoutes(app)

app.get('/api/health', (c) => {
  const session = sessionFromHeaders(c)
  const key = getOpenRouterKey()
  return c.json({
    ok: true,
    product: {
      code: PRODUCT_CODE,
      name: PRODUCT_NAME,
      notHiyenMatrix: PRODUCT_NOT_HIYEN_LABEL,
      disclaimer: PRODUCT_DISCLAIMER,
    },
    session: {
      userId: session.user.id,
      userName: session.user.displayName,
      workspaceId: session.workspace.id,
      workspaceName: session.workspace.name,
      workspaceSample: session.workspace.isSample,
      agentId: session.activeAgentId,
    },
    openRouterConfigured: Boolean(key),
    model: getOpenRouterModel(),
    providerOnly: getProviderOnly(),
    allowFallbacks: allowProviderFallbacks(),
    persistence: {
      ephemeral: Boolean(process.env.RAILWAY_ENVIRONMENT && process.env.MATRIX_VOLUME_MOUNTED !== 'true'),
      hint: 'Railway 請掛 Volume 至 /app/.data，並設 MATRIX_VOLUME_MOUNTED=true',
    },
  })
})

app.get('/api/session', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({
    session: {
      user: session.user,
      workspace: session.workspace,
      activeAgentId: session.activeAgentId,
      capabilities: sessionCapabilities(session),
    },
    agents: listAgents(session.workspace.id),
    workspaceMembers: listUsersInWorkspace(session.workspace.id),
    devUsers: listUsers().map((u) => ({ id: u.id, displayName: u.displayName, email: u.email })),
  })
})

app.get('/api/agents', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({ agents: listAgents(session.workspace.id) })
})

app.get('/api/platform', (c) => {
  return c.json({ platform: getPlatform(), suggestions: predictPrompts() })
})

app.post('/api/suggestions', async (c) => {
  const session = sessionFromHeaders(c)
  const body = await c.req.json<{
    messages?: { role: 'user' | 'assistant'; content: string }[]
    canvasSummary?: string
    agentId?: string
  }>()
  const platform = getPlatform()
  const suggestions = await llmPredictSuggestions({
    agentId: body.agentId ?? session.activeAgentId,
    messages: body.messages ?? [],
    canvasSummary: body.canvasSummary,
    count: platform.suggestionCount,
  })
  return c.json({ suggestions })
})

app.get('/api/mcp/catalog', (c) => {
  const session = sessionFromHeaders(c)
  const manifest = loadManifest(session.workspace.id, session.workspace.name)
  const moduleId = c.req.header('x-module-id') ?? c.req.query('moduleId')
  return c.json({ items: buildMcpCatalog(session.workspace.id, manifest, moduleId) })
})

app.get('/api/runs/recent', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({ runs: listRecentRuns(session.workspace.id) })
})

app.get('/api/runs/:runId/tree', (c) => {
  const nodes = getRunTree(c.req.param('runId'))
  return c.json({ runId: c.req.param('runId'), tree: buildTopologyTree(nodes), nodes })
})

app.get('/api/blocks/packages', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({ packages: listPackagesForWorkspace(session.workspace.id) })
})

app.post('/api/blocks/packages', async (c) => {
  const session = sessionFromHeaders(c)
  const body = await c.req.json<{
    name: string
    version: string
    componentId: string
    propsSchema?: Record<string, unknown>
    bundle?: Record<string, unknown>
  }>()
  const pkg = submitBlockPackage({
    workspaceId: session.workspace.id,
    authorUserId: session.user.id,
    name: body.name,
    version: body.version,
    componentId: body.componentId,
    propsSchema: body.propsSchema ?? {},
    bundle: body.bundle ?? { template: 'document', body: 'empty' },
  })
  return c.json({ package: pkg })
})

app.post('/api/blocks/packages/:id/approve', (c) => {
  const session = sessionFromHeaders(c)
  const pkg = approveBlockPackage(session.workspace.id, c.req.param('id'), true)
  return c.json({ package: pkg })
})

app.get('/api/storage', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({ objects: storageList(session.workspace.id) })
})

app.get('/api/billing/spec', (c) => {
  return c.json({ version: BILLING_SPEC_VERSION, quotes: DEFAULT_QUOTES })
})

app.get('/api/ops/summary', (c) => {
  const session = sessionFromHeaders(c)
  return c.json({ summary: summarizeOpLog(session.workspace.id) })
})

app.get('/api/ops/log', (c) => {
  const session = sessionFromHeaders(c)
  const limit = Math.min(200, Number(c.req.query('limit') || 60))
  return c.json({ entries: readOpLogEntries(session.workspace.id, limit) })
})

app.post('/api/ops/feedback', async (c) => {
  const session = sessionFromHeaders(c)
  const body = await c.req.json<{
    targetEntryId: string
    rating: 'helpful' | 'wrong' | 'partial'
    comment?: string
  }>()
  if (!body.targetEntryId || !body.rating) {
    return c.json({ error: 'targetEntryId and rating required' }, 400)
  }
  const id = logFeedback(session, {
    targetEntryId: body.targetEntryId,
    rating: body.rating,
    comment: body.comment,
  })
  return c.json({ ok: true, feedbackLogId: id })
})

void mountStdioFromEnv()

app.post('/api/mcp/invoke', async (c) => {
  const session = sessionFromHeaders(c)
  const runId = newRunId()
  const started = performance.now()
  const body = await c.req.json<{ tool: string; payload?: Record<string, unknown> }>()
  const userLogId = logUserMessage(session, body.tool, { source: 'invoke' })
  const result = await dispatchToolWithTrace(body.tool, body.payload, { source: 'invoke' })
  const nodes = persistTrace(result.trace, { runId, parentNodeId: null })
  const invokeLogId = logToolInvoke(session, {
    parentId: userLogId,
    runId,
    tool: body.tool,
    payload: body.payload,
    trace: result.trace,
    durationMs: Math.round(performance.now() - started),
  })
  return c.json({
    ui: result.ui,
    trace: result.trace,
    runId,
    runNodes: nodes,
    platform: getPlatform(),
    suggestions: predictPrompts(),
    invokeLogId,
  })
})

app.post('/api/agent/chat', async (c) => {
  const body = await c.req.json<{ messages: ChatMessage[]; agentId?: string }>()
  const messages = body.messages ?? []
  const session = sessionFromHeaders(c)
  const chatSession = body.agentId
    ? resolveSession(session.user.id, session.workspace.id, body.agentId)
    : session
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const text = lastUser?.content || ''
  const runId = newRunId()

  return streamSSE(c, async (stream) => {
    const status = (line: string) => stream.writeSSE({ event: 'status', data: JSON.stringify({ text: line }) })
    const finish = (payload: Record<string, unknown>) =>
      stream.writeSSE({ event: 'done', data: JSON.stringify(payload) })

    await runWithSession(chatSession, async () => {
      const started = performance.now()
      const userLogId = logUserMessage(chatSession, text, { source: 'chat' })
      await status('已收到問題')
      const instant = localAnswer(text)
      if (instant) {
        const replyLogId = logAssistantReply(chatSession, {
          parentId: userLogId,
          userText: text,
          runId,
          mode: 'offline',
          assistantMessage: instant,
          trace: [],
          provider: null,
          durationMs: Math.round(performance.now() - started),
        })
        await finish({
          mode: 'offline',
          assistantMessage: instant,
          ui: null,
          trace: [],
          runId,
          runNodes: [],
          platform: getPlatform(),
          suggestions: predictPrompts(),
          provider: null,
          model: null,
          agentId: chatSession.activeAgentId,
          replyLogId,
        })
        return
      }

      const explained = explainCapability(text)
      if (explained) {
        await status('這題在問已掛載的 MCP，直接讀工具清單')
        const turn = finalizeTurn(text, explained)
        await status('正在把能力說明畫上畫布')
        const nodes = persistTrace([], { runId, parentNodeId: null })
        const replyLogId = logAssistantReply(chatSession, {
          parentId: userLogId,
          userText: text,
          runId,
          mode: 'bridge',
          assistantMessage: '已說明掛載的 MCP 能做什麼。',
          trace: [],
          provider: null,
          durationMs: Math.round(performance.now() - started),
        })
        await finish({
          mode: 'bridge',
          assistantMessage: '已說明掛載的 MCP 能做什麼。',
          ui: turn.ui,
          trace: [],
          runId,
          runNodes: nodes,
          platform: turn.platform,
          suggestions: turn.suggestions,
          provider: null,
          model: null,
          agentId: chatSession.activeAgentId,
          replyLogId,
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
          if (classifyTurn(text) !== 'workspace') {
            const reply = chatFallback(text)
            const replyLogId = logAssistantReply(chatSession, {
              parentId: userLogId,
              userText: text,
              runId,
              mode: 'offline',
              assistantMessage: reply,
              trace: [],
              provider: null,
              durationMs: Math.round(performance.now() - started),
            })
            await finish({
              mode: 'offline',
              assistantMessage: reply,
              ui: null,
              trace: [],
              runId,
              runNodes: [],
              platform: getPlatform(),
              suggestions: predictPrompts(),
              provider: null,
              model: null,
              agentId: chatSession.activeAgentId,
              replyLogId,
            })
            return
          }
          await status('沒有 OpenRouter key，改走本機 MCP')
          const started = performance.now()
          const ui = await runKeywordAgent(text)
          const turn = finalizeTurn(text, ui)
          const trace = [
            {
              tool: 'keywordAgent',
              source: 'chat' as const,
              mode: 'offline' as const,
              durationMs: Math.round(performance.now() - started),
              ok: true,
            },
          ]
          const nodes = persistTrace(trace, { runId, parentNodeId: null })
          const replyLogId = logAssistantReply(chatSession, {
            parentId: userLogId,
            userText: text,
            runId,
            mode: 'offline',
            assistantMessage: '已用本機 MCP 回答。',
            trace,
            provider: null,
            durationMs: Math.round(performance.now() - started),
          })
          await finish({
            mode: 'offline',
            assistantMessage: '已用本機 MCP 回答。',
            ui: turn.ui,
            trace,
            runId,
            runNodes: nodes,
            platform: turn.platform,
            suggestions: turn.suggestions,
            provider: null,
            model: null,
            agentId: chatSession.activeAgentId,
            replyLogId,
          })
          return
        }

        const result = await runOpenRouterAgent(messages, chatSession.activeAgentId)
        clearInterval(timer)
        await status(result.provider ? `模型已回覆，上游是 ${result.provider}` : '模型已回覆')
        const turn = finalizeTurn(text, result.ui)
        if (result.ui) await status('正在把回覆畫上畫面')
        const nodes = persistTrace(result.trace, { runId, parentNodeId: null })
        const replyLogId = logAssistantReply(chatSession, {
          parentId: userLogId,
          userText: text,
          runId,
          mode: 'openrouter',
          assistantMessage: result.assistantMessage,
          trace: result.trace,
          provider: result.provider,
          durationMs: Math.round(performance.now() - started),
        })
        await finish({
          mode: 'openrouter',
          assistantMessage: result.assistantMessage,
          ui: turn.ui,
          trace: result.trace,
          runId,
          runNodes: nodes,
          platform: turn.platform,
          suggestions: turn.suggestions,
          provider: result.provider,
          model: result.model,
          agentId: chatSession.activeAgentId,
          replyLogId,
        })
      } catch (err) {
        clearInterval(timer)
        if (classifyTurn(text) !== 'workspace') {
          const reply = chatFallback(text)
          const replyLogId = logAssistantReply(chatSession, {
            parentId: userLogId,
            userText: text,
            runId,
            mode: 'fallback',
            assistantMessage: reply,
            trace: [],
            provider: null,
            error: err instanceof Error ? err.message : 'failed',
            durationMs: Math.round(performance.now() - started),
            ok: false,
          })
          await finish({
            mode: 'fallback',
            assistantMessage: reply,
            ui: null,
            trace: [],
            runId,
            runNodes: [],
            platform: getPlatform(),
            suggestions: predictPrompts(),
            provider: null,
            model: null,
            agentId: chatSession.activeAgentId,
            replyLogId,
          })
          return
        }
        await status('模型沒有順利回完，改用本機 MCP')
        const turn = finalizeTurn(text, await runKeywordAgent(text))
        const trace = [
          {
            tool: 'keywordAgent',
            source: 'chat' as const,
            mode: 'fallback' as const,
            durationMs: 0,
            ok: true,
            error: err instanceof Error ? err.message : 'failed',
          },
        ]
        const nodes = persistTrace(trace, { runId, parentNodeId: null })
        const errMsg = err instanceof Error ? err.message : 'failed'
        const replyLogId = logAssistantReply(chatSession, {
          parentId: userLogId,
          userText: text,
          runId,
          mode: 'fallback',
          assistantMessage: '模型暫時忙碌，已用本機 MCP 完成這一步。',
          trace,
          provider: null,
          error: errMsg,
          durationMs: Math.round(performance.now() - started),
          ok: false,
        })
        await finish({
          mode: 'fallback',
          assistantMessage: '模型暫時忙碌，已用本機 MCP 完成這一步。',
          ui: turn.ui,
          trace,
          runId,
          runNodes: nodes,
          platform: turn.platform,
          suggestions: turn.suggestions,
          provider: null,
          model: getOpenRouterModel(),
          error: errMsg,
          agentId: chatSession.activeAgentId,
          replyLogId,
        })
      }
    })
  })
})

const distDir = join(process.cwd(), 'dist')
const serveUi =
  process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true'
if (serveUi && existsSync(distDir)) {
  app.use('/assets/*', serveStatic({ root: './dist' }))
  app.get('*', (c, next) => {
    if (c.req.path.startsWith('/api/')) return next()
    return serveStatic({ path: './dist/index.html' })(c, next)
  })
} else {
  const devUi = (process.env.MATRIX_DEV_UI ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.notFound()
    const target = new URL(c.req.path, `${devUi}/`)
    target.search = new URL(c.req.url).search
    return c.redirect(target.toString())
  })
}

const port = Number(process.env.PORT || 8787)
console.log(`${PRODUCT_NAME} API http://127.0.0.1:${port}${serveUi ? ' (+ static UI)' : ''}`)
serve({ fetch: app.fetch, port })
