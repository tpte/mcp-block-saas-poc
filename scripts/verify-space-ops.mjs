#!/usr/bin/env node
/**
 * SPACE 操作可發現性：營運工作區 pill、manifest admin、catalog 可用。
 */
const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

const companyHeaders = {
  'X-User-Id': 'user-alan',
  'X-Workspace-Id': 'ws-company',
  'X-Agent-Id': 'agent-company-copilot',
}

const personalHeaders = {
  'X-User-Id': 'user-alan',
  'X-Workspace-Id': 'ws-personal',
  'X-Agent-Id': 'agent-personal',
}

async function get(path, headers) {
  const res = await fetch(`${base}${path}`, { headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} ${res.status}: ${json.error ?? res.statusText}`)
  return json
}

const checks = []

try {
  const companyPlatform = await get('/api/platform', companyHeaders)
  checks.push(['company modulePillsEnabled', companyPlatform.platform?.modulePillsEnabled === true])

  const personalPlatform = await get('/api/platform', personalHeaders)
  checks.push(['personal moduleSidebarEnabled', personalPlatform.platform?.moduleSidebarEnabled === true])

  const manifest = await get('/api/manifest', companyHeaders)
  checks.push(['company spaceProfile cockpit', manifest.manifest?.ui?.spaceProfile === 'cockpit'])
  checks.push(['company cockpit slots', (manifest.manifest?.ui?.cockpit?.left?.length ?? 0) >= 1])
  checks.push(
    ['company enabled modules',
      (manifest.manifest?.modules?.enabledCatalogIds?.length ?? 0) >= 4],
  )

  const catalog = await get('/api/mcp/catalog', companyHeaders)
  checks.push(['company catalog items', (catalog.items?.length ?? 0) >= 4])

  const failed = checks.filter(([, ok]) => !ok)
  for (const [name, ok] of checks) {
    console.log(ok ? 'OK' : 'FAIL', name)
  }
  if (failed.length) {
    console.error(`\n${failed.length} space-ops check(s) failed at ${base}`)
    process.exit(1)
  }
  console.log(`\nspace-ops verify passed (${base})`)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
