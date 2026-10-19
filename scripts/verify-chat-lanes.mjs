#!/usr/bin/env node
/**
 * 驗收 SPACE 對話分軌：寒暄 offline、資料 direct、示範工作區不誤走 bridge。
 * Usage: BASE_URL=https://matrix-mcp-production.up.railway.app npm run verify:chat
 */
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

const headers = (ws, agent) => ({
  'X-User-Id': 'user-alan',
  'X-Workspace-Id': ws,
  'X-Agent-Id': agent,
})

async function chat(ws, agent, text) {
  const res = await fetch(`${base}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers(ws, agent) },
    body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
  })
  const raw = await res.text()
  const done = [...raw.matchAll(/event: done\ndata: (.+)/g)].at(-1)?.[1]
  if (!done) throw new Error(`no done event: ${text}`)
  return JSON.parse(done)
}

const cases = [
  {
    name: 'personal-greeting',
    ws: 'ws-personal',
    agent: 'agent-personal',
    text: '早安',
    assert: (p) => p.mode === 'offline' && !(p.trace || []).length,
  },
  {
    name: 'personal-leave',
    ws: 'ws-personal',
    agent: 'agent-personal',
    text: '看這個月的請假',
    assert: (p) =>
      p.mode === 'offline' && (p.trace || []).some((t) => t.tool === 'hr:get_leave') && p.ui,
  },
  {
    name: 'sample-leave',
    ws: 'ws-sample',
    agent: 'agent-sample-personal',
    text: '看這個月的請假',
    assert: (p) =>
      p.mode === 'offline' && (p.trace || []).some((t) => t.tool === 'hr:get_leave') && p.ui,
  },
  {
    name: 'company-cashflow',
    ws: 'ws-company',
    agent: 'agent-company-copilot',
    text: '本週現金流',
    assert: (p) =>
      p.mode === 'offline' &&
      (p.trace || []).some((t) => t.tool === 'finance:get_cashflow') &&
      p.ui,
  },
  {
    name: 'personal-search',
    ws: 'ws-personal',
    agent: 'agent-personal',
    text: '搜尋 玉山 高度',
    assert: (p) => {
      const tools = (p.trace || []).map((t) => t.tool).join(',')
      return (
        (p.mode === 'openrouter' || p.mode === 'offline') &&
        !/hr:|finance:|builder:/.test(tools) &&
        String(p.assistantMessage || '').length > 4 &&
        !p.ui
      )
    },
  },
]

const workspaceChecks = [
  { ws: 'ws-personal', agent: 'agent-personal' },
  { ws: 'ws-sample', agent: 'agent-sample-personal' },
  { ws: 'ws-company', agent: 'agent-company-copilot' },
]

let failed = 0
try {
  const wsRes = await fetch(`${base}/api/workspaces`, { headers: headers('ws-personal', 'agent-personal') })
  const wsJson = await wsRes.json().catch(() => ({}))
  if (!wsRes.ok || !Array.isArray(wsJson.workspaces) || wsJson.workspaces.length < 3) {
    console.error('FAIL', 'workspaces-list', wsJson.workspaces?.length ?? 0)
    failed += 1
  } else {
    console.log('OK', 'workspaces-list', `count=${wsJson.workspaces.length}`)
  }
} catch (err) {
  console.error('FAIL', 'workspaces-list', err.message)
  failed += 1
}
for (const { ws, agent } of workspaceChecks) {
  try {
    const res = await fetch(`${base}/api/session`, { headers: headers(ws, agent) })
    const data = await res.json()
    const sessionOk =
      res.ok &&
      data.agents?.length &&
      data.session?.capabilities?.role &&
      Array.isArray(data.workspaceMembers) &&
      Array.isArray(data.devUsers)
    if (!sessionOk) {
      console.error('FAIL', 'session-agents', ws, data.agents?.length ?? 0)
      failed += 1
    } else {
      console.log('OK', 'session-agents', ws)
    }
    const plat = await fetch(`${base}/api/platform`, { headers: headers(ws, agent) }).then((r) =>
      r.json(),
    )
    const bad = (plat.suggestions ?? []).some((s) => /接上.*公司|還缺什麼|skill/i.test(s))
    if (bad) {
      console.error('FAIL', 'suggestions-clean', ws, plat.suggestions)
      failed += 1
    } else {
      console.log('OK', 'suggestions-clean', ws)
    }
    const modulesRes = await fetch(`${base}/api/modules`, { headers: headers(ws, agent) })
    const modulesJson = await modulesRes.json().catch(() => ({}))
    if (!modulesRes.ok || !Array.isArray(modulesJson.modules) || modulesJson.modules.length === 0) {
      console.error('FAIL', 'modules-catalog', ws)
      failed += 1
    } else {
      console.log('OK', 'modules-catalog', ws, `modules=${modulesJson.modules.length}`)
    }
    const manifestRes = await fetch(`${base}/api/manifest`, { headers: headers(ws, agent) })
    const manifestJson = await manifestRes.json().catch(() => ({}))
    const profile = manifestJson.manifest?.ui?.spaceProfile ?? 'default'
    if (!manifestRes.ok || !manifestJson.manifest) {
      console.error('FAIL', 'manifest-get', ws)
      failed += 1
    } else {
      console.log('OK', 'manifest-get', ws, `spaceProfile=${profile}`)
    }
    const canvasRes = await fetch(`${base}/api/canvas`, { headers: headers(ws, agent) })
    const canvasJson = await canvasRes.json().catch(() => ({}))
    const blockCount = canvasJson.canvas?.blocks?.length ?? 0
    if (!canvasRes.ok) {
      console.error('FAIL', 'canvas-get', ws, canvasRes.status)
      failed += 1
    } else {
      console.log('OK', 'canvas-get', ws, `blocks=${blockCount}`)
    }
  } catch (err) {
    console.error('FAIL', 'workspace-meta', ws, err.message)
    failed += 1
  }
}
for (const c of cases) {
  try {
    const p = await chat(c.ws, c.agent, c.text)
    if (!c.assert(p)) {
      console.error('FAIL', c.name, p.mode, (p.trace || []).map((t) => t.tool).join(','))
      failed += 1
    } else {
      console.log('OK', c.name)
    }
  } catch (err) {
    console.error('FAIL', c.name, err.message)
    failed += 1
  }
}
if (failed) process.exit(1)
