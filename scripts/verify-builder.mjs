#!/usr/bin/env node
/**
 * Builder PoC 驗收：health、skills、templates、setup-context、RAG、preview。
 * Usage: BASE_URL=https://matrix-mcp-production.up.railway.app npm run verify:builder
 */
const base = (process.env.BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')
const headers = {
  'X-User-Id': process.env.MATRIX_USER_ID ?? 'user-alan',
  'X-Workspace-Id': process.env.MATRIX_WORKSPACE_ID ?? 'ws-hiyen',
  'X-Agent-Id': process.env.MATRIX_AGENT_ID ?? 'agent-hiyen-personal',
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`${path} ${res.status}: not JSON (${text.slice(0, 80)})`)
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.error ?? text}`)
  return json
}

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.error ?? res.statusText}`)
  return json
}

const checks = []

try {
  const health = await get('/api/health')
  checks.push(['health ok', health.ok === true])

  const skills = await get('/api/builder/skills')
  checks.push(['skills >= 4', (skills.skills?.length ?? 0) >= 4])

  const templates = await get('/api/builder/templates')
  checks.push(['templates >= 3', (templates.templates?.length ?? 0) >= 3])

  const ctx = await get('/api/builder/setup-context')
  checks.push(['setup-context catalogOptions', (ctx.context?.catalogOptions?.length ?? 0) > 0])

  const rag = await post('/api/builder/rag/search', { query: '資料庫 SQLite', limit: 3 })
  checks.push(['rag hits', (rag.hits?.length ?? 0) > 0])

  const preview = await post('/api/builder/preview', {
    enabledCatalogIds: ['hr:get_leave', 'finance:get_cashflow', 'bridge:list'],
  })
  checks.push(['preview diff', Array.isArray(preview.diff)])

  const failed = checks.filter(([, ok]) => !ok)
  for (const [name, ok] of checks) {
    console.log(ok ? '✓' : '✗', name)
  }
  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed at ${base}`)
    process.exit(1)
  }
  console.log(`\nBuilder verify passed (${base})`)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
