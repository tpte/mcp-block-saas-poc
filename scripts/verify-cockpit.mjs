#!/usr/bin/env node
/**
 * Cockpit 三欄：manifest 固定格 + workspace:navigate 可 invoke。
 */
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

const companyHeaders = {
  'X-User-Id': 'user-alan',
  'X-Workspace-Id': 'ws-company',
  'X-Agent-Id': 'agent-company-copilot',
}

async function get(path, headers) {
  const res = await fetch(`${base}${path}`, { headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.error ?? res.statusText}`)
  return json
}

async function post(path, body, headers) {
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
  const manifest = await get('/api/manifest', companyHeaders)
  const cockpit = manifest.manifest?.ui?.cockpit
  checks.push(['cockpit profile', manifest.manifest?.ui?.spaceProfile === 'cockpit'])
  checks.push(['cockpit left kpi', cockpit?.left?.some((s) => s.tool === 'analytics:kpi_week') === true])
  checks.push(['cockpit right cashflow', cockpit?.right?.some((s) => s.tool === 'finance:get_cashflow') === true])

  const nav = await post(
    '/api/mcp/invoke',
    { tool: 'workspace:navigate', payload: { path: 'studio', query: { focus: 'builder' } } },
    companyHeaders,
  )
  checks.push(['workspace:navigate ui', nav.ui?.action === 'RENDER'])
  checks.push(['workspace:navigate trace ok', nav.trace?.[0]?.ok === true])

  const kpi = await post('/api/mcp/invoke', { tool: 'analytics:kpi_week' }, companyHeaders)
  checks.push(['slot tool kpi blocks', (kpi.ui?.action === 'RENDER' && kpi.ui?.ui?.blocks?.length) > 0])

  const failed = checks.filter(([, ok]) => !ok)
  for (const [name, ok] of checks) {
    console.log(ok ? 'OK' : 'FAIL', name)
  }
  if (failed.length) {
    console.error(`\n${failed.length} cockpit check(s) failed at ${base}`)
    process.exit(1)
  }
  console.log(`\nAll cockpit checks passed (${base})`)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
