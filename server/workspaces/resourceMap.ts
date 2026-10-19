import type { ResourceGraph, ResourceHealth } from '../../shared/resourceGraph.ts'
import { listAgents } from '../db/store.ts'
import { buildMcpCatalog } from '../mcp/catalog.ts'
import { listMountedMcps } from '../mcp/bridge.ts'
import { storageList } from '../storage/workspaceStorage.ts'
import { loadManifest } from './manifest.ts'
import { probeAllDataSources, probeApiHealth } from './datasource.ts'

async function checkUrl(url: string): Promise<ResourceHealth> {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) })
    return res.ok ? 'healthy' : 'degraded'
  } catch {
    return 'down'
  }
}

export async function buildResourceGraph(workspaceId: string, workspaceName: string): Promise<ResourceGraph> {
  const manifest = loadManifest(workspaceId, workspaceName)
  const catalog = buildMcpCatalog(workspaceId, manifest)
  const nodes: ResourceGraph['nodes'] = []
  const edges: ResourceGraph['edges'] = []

  nodes.push({
    id: `ws:${workspaceId}`,
    kind: 'Workspace',
    label: manifest.displayName || workspaceName,
    health: 'healthy',
  })

  for (const item of catalog) {
    nodes.push({
      id: `mod:${item.id}`,
      kind: 'Module',
      label: item.label,
      health: 'healthy',
      meta: { tool: item.tool },
    })
    edges.push({
      id: `e-mod-ws-${item.id}`,
      from: `mod:${item.id}`,
      to: `ws:${workspaceId}`,
      kind: 'memberOf',
    })
  }

  const dsList = await probeAllDataSources(manifest.dataSources)
  for (const ds of dsList) {
    nodes.push({
      id: `ds:${ds.id}`,
      kind: 'DataSource',
      label: ds.label,
      health: ds.health ?? 'unknown',
      meta: { type: ds.type },
    })
    edges.push({ id: `e-ds-ws-${ds.id}`, from: `ds:${ds.id}`, to: `ws:${workspaceId}`, kind: 'reads' })
  }

  try {
    const bridge = listMountedMcps()
    const blocks = 'blocks' in bridge ? bridge.blocks : []
    for (const b of blocks as { props?: { data?: { server?: string }[] } }[]) {
      const rows = b.props?.data ?? []
      for (const row of rows) {
        const name = row.server ?? 'mcp'
        if (nodes.some((n) => n.id === `mcp:${name}`)) continue
        nodes.push({ id: `mcp:${name}`, kind: 'McpServer', label: name, health: 'healthy' })
        edges.push({ id: `e-mcp-${name}`, from: `mcp:${name}`, to: `ws:${workspaceId}`, kind: 'uses' })
      }
    }
  } catch {
    nodes.push({ id: 'mcp:notes', kind: 'McpServer', label: 'notes', health: 'healthy' })
  }

  for (const agent of listAgents(workspaceId)) {
    nodes.push({
      id: `agent:${agent.id}`,
      kind: 'Agent',
      label: agent.name,
      health: 'healthy',
      meta: { kind: agent.kind },
    })
    edges.push({ id: `e-agent-${agent.id}`, from: `agent:${agent.id}`, to: `ws:${workspaceId}`, kind: 'memberOf' })
  }

  for (const obj of storageList(workspaceId).slice(0, 12)) {
    nodes.push({
      id: `file:${obj.key}`,
      kind: 'StorageFile',
      label: obj.key,
      health: 'healthy',
    })
    edges.push({
      id: `e-file-${obj.key}`,
      from: `file:${obj.key}`,
      to: `ws:${workspaceId}`,
      kind: 'hostedOn',
    })
  }

  if (manifest.git?.repo) {
    nodes.push({
      id: 'git:main',
      kind: 'GitRepo',
      label: manifest.git.repo,
      health: 'unknown',
      meta: { branch: manifest.git.branch },
    })
    edges.push({ id: 'e-git-ws', from: 'git:main', to: `ws:${workspaceId}`, kind: 'syncsFrom' })
  }

  const apiHealth = await probeApiHealth()
  for (const dep of manifest.deployments) {
    let health: ResourceHealth = dep.status ?? 'unknown'
    if (dep.url) health = await checkUrl(`${dep.url}/api/health`)
    nodes.push({
      id: `dep:${dep.id}`,
      kind: 'Deployment',
      label: dep.url ?? dep.id,
      health,
      meta: { target: dep.target },
    })
    edges.push({ id: `e-dep-${dep.id}`, from: `dep:${dep.id}`, to: `ws:${workspaceId}`, kind: 'deploys' })
  }

  if (manifest.deployments.length === 0) {
    const railway = process.env.RAILWAY_PUBLIC_DOMAIN
    if (railway) {
      const url = `https://${railway}`
      const health = await checkUrl(`${url}/api/health`)
      nodes.push({
        id: 'dep:matrix-railway',
        kind: 'Deployment',
        label: url,
        health: health === 'healthy' && apiHealth === 'healthy' ? 'healthy' : 'degraded',
      })
      edges.push({ id: 'e-dep-rw', from: 'dep:matrix-railway', to: `ws:${workspaceId}`, kind: 'deploys' })
    }
  }

  return { nodes, edges, updatedAt: new Date().toISOString() }
}
