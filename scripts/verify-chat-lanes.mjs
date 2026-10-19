#!/usr/bin/env node
/**
 * 驗收 SPACE 對話分軌：寒暄 offline、資料 direct、示範工作區不誤走 bridge。
 * Usage: BASE_URL=https://matrix-mcp-production.up.railway.app npm run verify:chat
 */
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

async function chat(ws, agent, text) {
  const res = await fetch(`${base}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'user-alan',
      'X-Workspace-Id': ws,
      'X-Agent-Id': agent,
    },
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
    agent: 'agent-personal',
    text: '看這個月的請假',
    assert: (p) =>
      p.mode === 'offline' && (p.trace || []).some((t) => t.tool === 'hr:get_leave') && p.ui,
  },
]

let failed = 0
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
