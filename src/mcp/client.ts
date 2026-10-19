import type { Agent, Workspace } from '../../shared/domain.ts'
import type { BlockTemplate } from '../../shared/blockTemplates.ts'
import type { ResourceGraph } from '../../shared/resourceGraph.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import type { CanvasPage } from '../types/ui.ts'
import type { PlatformConfig } from '../../shared/platform.ts'
import type { OpFeedbackRating, OpLogEntry, OpLogSummary } from '../../shared/opsLog.ts'
import type { ToolTraceEntry } from '../../shared/trace.ts'
import { loadClientSession, sessionHeaders, type ClientSession } from '../session/apiHeaders.ts'
import type { McpUiResponse } from '../types/ui.ts'

export type { PlatformConfig }

export type CatalogItem = {
  id: string
  label: string
  group: string
  tool: string
  defaultPayload?: Record<string, unknown>
}

export type HealthInfo = {
  ok: boolean
  session?: {
    userId: string
    userName: string
    workspaceId: string
    workspaceName: string
    workspaceSample: boolean
    agentId: string
  }
  openRouterConfigured: boolean
  model: string
  providerOnly: string[]
  allowFallbacks: boolean
}

export type RunNode = {
  id: string
  runId: string
  parentId: string | null
  workspaceId: string
  userId: string
  agentId: string
  tool: string
  mcpServer?: string | null
  durationMs: number
  ok: boolean
  error?: string | null
}

function apiFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  const session = loadClientSession()
  for (const [k, v] of Object.entries(sessionHeaders(session))) headers.set(k, v)
  return fetch(input, { ...init, headers })
}

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await apiFetch('/api/health')
  if (!res.ok) throw new Error('health failed')
  return res.json()
}

export async function fetchSession(): Promise<{ session: ClientSession & { userName?: string }; agents: Agent[] }> {
  const res = await apiFetch('/api/session')
  if (!res.ok) throw new Error('session failed')
  const data = await res.json()
  return {
    session: {
      userId: data.session.user.id,
      workspaceId: data.session.workspace.id,
      agentId: data.session.activeAgentId,
      userName: data.session.user.displayName,
    },
    agents: data.agents,
  }
}

export async function fetchPlatform(): Promise<{ platform: PlatformConfig; suggestions: string[] }> {
  const res = await apiFetch('/api/platform')
  if (!res.ok) throw new Error('platform failed')
  return res.json()
}

export async function fetchOpsSummary(): Promise<{ summary: OpLogSummary }> {
  const res = await apiFetch('/api/ops/summary')
  if (!res.ok) throw new Error('ops summary failed')
  return res.json()
}

export async function fetchOpsLog(limit = 60): Promise<{ entries: OpLogEntry[] }> {
  const res = await apiFetch(`/api/ops/log?limit=${limit}`)
  if (!res.ok) throw new Error('ops log failed')
  return res.json()
}

export async function submitOpFeedback(input: {
  targetEntryId: string
  rating: OpFeedbackRating
  comment?: string
}) {
  const res = await apiFetch('/api/ops/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('feedback failed')
  return res.json() as Promise<{ ok: boolean; feedbackLogId: string }>
}

export async function fetchSuggestions(input: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  canvasSummary: string
  agentId: string
}): Promise<{ suggestions: string[] }> {
  const res = await apiFetch('/api/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('suggestions failed')
  return res.json()
}

export async function fetchMcpCatalog(): Promise<{ items: CatalogItem[] }> {
  const res = await apiFetch('/api/mcp/catalog')
  if (!res.ok) throw new Error('catalog failed')
  return res.json()
}

export async function fetchRunTree(runId: string) {
  const res = await apiFetch(`/api/runs/${runId}/tree`)
  if (!res.ok) throw new Error('run tree failed')
  return res.json() as Promise<{ runId: string; tree: RunNode[]; nodes: RunNode[] }>
}

export async function invokeMcpTool(tool: string, payload?: Record<string, unknown>) {
  const res = await apiFetch('/api/mcp/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, payload }),
  })
  return res.json() as Promise<{
    ui: McpUiResponse | null
    trace: ToolTraceEntry[]
    runId: string
    platform: PlatformConfig
    suggestions: string[]
  }>
}

export type AgentChatResult = {
  mode: string
  assistantMessage: string
  ui: McpUiResponse | null
  trace?: ToolTraceEntry[]
  runId?: string
  replyLogId?: string
  agentId?: string
  platform: PlatformConfig
  suggestions: string[]
  provider: string | null
  model: string | null
  error?: string
}

export async function sendAgentChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onStatus?: (text: string) => void,
  agentId?: string,
): Promise<AgentChatResult> {
  const session = loadClientSession()
  const res = await apiFetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, agentId: agentId ?? session.agentId }),
  })
  if (!res.body) throw new Error('沒有串流')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: AgentChatResult | null = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.+)$/m)?.[1] ?? 'message'
      const data = chunk.match(/^data: (.+)$/m)?.[1]
      if (!data) continue
      const payload = JSON.parse(data) as { text?: string } & AgentChatResult
      if (event === 'status' && payload.text) onStatus?.(payload.text)
      if (event === 'done') result = payload
    }
  }

  if (!result) throw new Error('串流沒有結束')
  return result
}

export async function fetchWorkspaces(): Promise<{ workspaces: Workspace[] }> {
  const res = await apiFetch('/api/workspaces')
  if (!res.ok) throw new Error('workspaces failed')
  return res.json()
}

export async function fetchManifest(): Promise<{ manifest: WorkspaceManifest }> {
  const res = await apiFetch('/api/manifest')
  if (!res.ok) throw new Error('manifest failed')
  return res.json()
}

export async function saveManifest(manifest: WorkspaceManifest) {
  const res = await apiFetch('/api/manifest', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifest }),
  })
  if (!res.ok) throw new Error('manifest save failed')
  return res.json() as Promise<{ ok: boolean; revision: number; diff: { type: string; text: string }[] }>
}

export async function fetchResourceMap(): Promise<{ graph: ResourceGraph }> {
  const res = await apiFetch('/api/resource-map')
  if (!res.ok) throw new Error('resource map failed')
  return res.json()
}

export async function fetchWorkbenchFile(key: string) {
  const res = await apiFetch(`/api/workbench/file?key=${encodeURIComponent(key)}`)
  if (!res.ok) throw new Error('workbench read failed')
  return res.json() as Promise<{ key: string; content: string | null }>
}

export async function saveWorkbenchFile(key: string, content: string) {
  const res = await apiFetch('/api/workbench/file', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, content }),
  })
  if (!res.ok) throw new Error('workbench write failed')
  return res.json()
}

export async function fetchBlockTemplates(): Promise<{ templates: BlockTemplate[] }> {
  const res = await apiFetch('/api/blocks/templates')
  if (!res.ok) throw new Error('templates failed')
  return res.json()
}

export type StoredCanvas = CanvasPage & { revision: number }

export async function fetchCanvas(): Promise<{ canvas: StoredCanvas; mergeMode: 'merge' | 'replace' }> {
  const res = await apiFetch('/api/canvas')
  if (!res.ok) throw new Error('canvas failed')
  return res.json()
}

export async function saveCanvasApi(canvas: StoredCanvas, revision?: number) {
  const res = await apiFetch('/api/canvas', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvas, revision }),
  })
  if (!res.ok) throw new Error('canvas save failed')
  return res.json() as Promise<{ canvas: StoredCanvas }>
}

export async function addCanvasBlock(templateId: string, props?: Record<string, unknown>) {
  const res = await apiFetch('/api/canvas/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, props }),
  })
  if (!res.ok) throw new Error('canvas add failed')
  return res.json() as Promise<{ canvas: StoredCanvas; blockId: string }>
}

export async function patchCanvasBlock(blockId: string, props: Record<string, unknown>) {
  const res = await apiFetch(`/api/canvas/blocks/${blockId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ props }),
  })
  if (!res.ok) throw new Error('canvas patch failed')
  return res.json() as Promise<{ canvas: StoredCanvas }>
}

export async function deleteCanvasBlock(blockId: string) {
  const res = await apiFetch(`/api/canvas/blocks/${blockId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('canvas delete failed')
  return res.json() as Promise<{ canvas: StoredCanvas }>
}

export async function createWorkspaceInvite(workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') {
  const res = await apiFetch(`/api/workspaces/${workspaceId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  })
  if (!res.ok) throw new Error('invite failed')
  return res.json()
}
