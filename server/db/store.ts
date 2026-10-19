import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_LAYOUT_PREFERENCES } from '../../shared/platform.ts'
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../../shared/product.ts'
import type { PlatformConfig } from '../../shared/platform.ts'
import { randomUUID } from 'node:crypto'
import type {
  Agent,
  BlockPackage,
  McpMountRecord,
  RunNode,
  SessionContext,
  User,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from '../../shared/domain.ts'
import { storagePut } from '../storage/workspaceStorage.ts'

type DbShape = {
  users: User[]
  workspaces: Workspace[]
  agents: Agent[]
  platformByWorkspace: Record<string, PlatformConfig>
  mcpMounts: McpMountRecord[]
  blockPackages: BlockPackage[]
  runNodes: RunNode[]
  workspaceMembers: WorkspaceMember[]
  workspaceInvites: WorkspaceInvite[]
}

const DATA_DIR = join(process.cwd(), '.data')
const DB_PATH = join(DATA_DIR, 'platform.json')

const defaultPlatform = (): PlatformConfig => ({
  theme: 'light',
  composerPosition: 'bottom',
  composerWidth: 'narrow',
  placeholder: '跟 Agent 說你想看什麼…',
  showHistory: false,
  suggestionsEnabled: true,
  suggestionCount: 3,
  title: PRODUCT_NAME,
  subtitle: PRODUCT_SUBTITLE,
  canvasMaxWidth: 'xl',
  density: 'comfortable',
  showModelBadge: true,
  moduleSidebarEnabled: false,
  modulePillsEnabled: false,
  commandPaletteEnabled: true,
  showToolTrace: true,
  keyboardShortcuts: {},
  layoutPreferences: { ...DEFAULT_LAYOUT_PREFERENCES },
})

function seed(): DbShape {
  const userAlan: User = { id: 'user-alan', email: 'alan@example.com', displayName: 'Alan Huang' }
  const userDemo: User = { id: 'user-demo', email: 'demo@example.com', displayName: 'Demo User' }
  const wsPersonal: Workspace = { id: 'ws-personal', name: 'Alan 個人駕駛艙', slug: 'personal', isSample: false }
  const wsSample: Workspace = { id: 'ws-sample', name: '示範 ERP Sample', slug: 'sample-erp', isSample: true }
  const wsHiyen: Workspace = { id: 'ws-hiyen', name: 'HIYEN', slug: 'hiyen', isSample: false }

  const orchestrator: Agent = {
    id: 'agent-orch',
    workspaceId: wsPersonal.id,
    ownerUserId: userAlan.id,
    name: '中心調度',
    kind: 'orchestrator',
    systemPrompt: '你是工作區 orchestrator。可 delegate 給 HR、Finance worker。繁中。',
    policy: {
      allowedToolPrefixes: ['agent:', 'canvas:', 'platform:', 'bridge:', 'notes:', 'builder:'],
      allowedMcpServers: ['notes'],
      canDelegate: true,
    },
  }
  const workerHr: Agent = {
    id: 'agent-hr',
    workspaceId: wsPersonal.id,
    ownerUserId: userAlan.id,
    name: 'HR Worker',
    kind: 'worker',
    systemPrompt: '你只處理 HR 請假與員工資料。繁中。',
    policy: {
      allowedToolPrefixes: ['hr:', 'canvas:', 'platform:'],
      allowedMcpServers: [],
      canDelegate: false,
    },
  }
  const workerFinance: Agent = {
    id: 'agent-finance',
    workspaceId: wsPersonal.id,
    ownerUserId: userAlan.id,
    name: 'Finance Worker',
    kind: 'worker',
    systemPrompt: '你只處理財務、發票、現金流。繁中。',
    policy: {
      allowedToolPrefixes: ['finance:', 'canvas:', 'platform:'],
      allowedMcpServers: [],
      canDelegate: false,
    },
  }
  const personalAgent: Agent = {
    id: 'agent-personal',
    workspaceId: wsPersonal.id,
    ownerUserId: userAlan.id,
    name: 'Personal Copilot',
    kind: 'personal',
    systemPrompt:
      '你是 Alan 的個人助手，可存取工作區內允許的所有 tools。協助使用者用 builder Skills 客製後台。繁中。',
    policy: {
      allowedToolPrefixes: [
        'hr:',
        'finance:',
        'sales:',
        'inventory:',
        'support:',
        'analytics:',
        'canvas:',
        'platform:',
        'bridge:',
        'agent:',
        'builder:',
      ],
      allowedMcpServers: ['notes'],
      canDelegate: true,
    },
  }

  const demoPkg: BlockPackage = {
    id: 'pkg-demo-hello',
    workspaceId: wsPersonal.id,
    authorUserId: userAlan.id,
    name: 'hello',
    version: '1.0.0',
    componentId: 'demo/hello@1.0.0',
    propsSchemaJson: '{}',
    bundlePath: 'blocks/hello@1.0.0.json',
    status: 'published',
    createdAt: new Date().toISOString(),
  }
  storagePut(
    wsPersonal.id,
    demoPkg.bundlePath,
    JSON.stringify({ template: 'document', body: '這是已發布的示範 Block 套件。' }),
  )

  const hiyenPersonal: Agent = {
    ...personalAgent,
    id: 'agent-hiyen-personal',
    workspaceId: wsHiyen.id,
    name: 'HIYEN Copilot',
    systemPrompt:
      '你是 HIYEN 工作區的客製化後台夥伴。使用者可能不懂程式；用 builder Skills 與 RAG 引導（資料源、模組、畫布），模板只在使用者要還原時套用。繁中。',
  }

  const samplePersonal: Agent = {
    ...personalAgent,
    id: 'agent-sample-personal',
    workspaceId: wsSample.id,
    name: 'ERP 示範 Copilot',
    systemPrompt: '你是示範 ERP 工作區的助手。協助查看示範資料與模組。繁中。',
  }

  return {
    users: [userAlan, userDemo],
    workspaces: [wsPersonal, wsSample, wsHiyen],
    agents: [orchestrator, workerHr, workerFinance, personalAgent, hiyenPersonal, samplePersonal],
    platformByWorkspace: {
      [wsPersonal.id]: defaultPlatform(),
      [wsSample.id]: { ...defaultPlatform(), title: '示範 ERP', subtitle: 'Sample 資料，非真實商用' },
      [wsHiyen.id]: { ...defaultPlatform(), title: 'HIYEN', subtitle: 'HIYEN 工作區後台（MATRIX 租戶，≠ HIYEN MATRIX 產品）' },
    },
    mcpMounts: [],
    blockPackages: [demoPkg],
    runNodes: [],
    workspaceMembers: [
      { workspaceId: wsPersonal.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsPersonal.id, userId: userDemo.id, role: 'member' },
      { workspaceId: wsSample.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsHiyen.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsHiyen.id, userId: userDemo.id, role: 'member' },
    ],
    workspaceInvites: [],
  }
}

let cache: DbShape | null = null

/** 舊 DB 可能缺某些工作區的 Agent；從 seed 補齊 personal copilot。 */
function ensureWorkspaceAgents(db: DbShape) {
  const fresh = seed()
  let changed = false
  for (const ws of db.workspaces) {
    if (db.agents.some((a) => a.workspaceId === ws.id)) continue
    const fromSeed = fresh.agents.filter((a) => a.workspaceId === ws.id)
    if (fromSeed.length) {
      db.agents.push(...fromSeed)
      changed = true
      continue
    }
    const tpl = fresh.agents.find((a) => a.kind === 'personal')
    if (!tpl) continue
    db.agents.push({
      ...tpl,
      id: `agent-${ws.id}-copilot`,
      workspaceId: ws.id,
      name: `${ws.name} Copilot`,
    })
    changed = true
  }
  return changed
}

function load(): DbShape {
  if (cache) return cache
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DB_PATH)) {
    cache = seed()
    persist()
    return cache
  }
  cache = JSON.parse(readFileSync(DB_PATH, 'utf8')) as DbShape
  if (!Array.isArray(cache.workspaceInvites)) cache.workspaceInvites = []
  if (!cache.workspaces.some((w) => w.slug === 'hiyen')) {
    const fresh = seed()
    const hiyen = fresh.workspaces.find((w) => w.slug === 'hiyen')!
    cache.workspaces.push(hiyen)
    cache.platformByWorkspace[hiyen.id] = fresh.platformByWorkspace[hiyen.id]!
    cache.agents.push(...fresh.agents.filter((a) => a.workspaceId === hiyen.id))
    cache.workspaceMembers.push(...fresh.workspaceMembers.filter((m) => m.workspaceId === hiyen.id))
    persist()
  }
  if (!Array.isArray(cache.agents) || cache.agents.length === 0) {
    const fresh = seed()
    cache.users = fresh.users
    cache.workspaces = fresh.workspaces
    cache.agents = fresh.agents
    cache.workspaceMembers = fresh.workspaceMembers
    cache.blockPackages = fresh.blockPackages
    cache.platformByWorkspace = { ...fresh.platformByWorkspace, ...cache.platformByWorkspace }
    persist()
  }
  if (ensureWorkspaceAgents(cache)) persist()
  let agentPolicyMigrated = false
  for (const agent of cache.agents) {
    if (
      (agent.kind === 'personal' || agent.kind === 'orchestrator') &&
      !agent.policy.allowedToolPrefixes.includes('builder:')
    ) {
      agent.policy.allowedToolPrefixes.push('builder:')
      agentPolicyMigrated = true
    }
  }
  if (agentPolicyMigrated) persist()
  return cache
}

function persist() {
  if (!cache) return
  writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), 'utf8')
}

export function getDb() {
  return load()
}

export function saveDb() {
  persist()
}

export function getMemberRole(workspaceId: string, userId: string): WorkspaceRole | null {
  const m = load().workspaceMembers.find((x) => x.workspaceId === workspaceId && x.userId === userId)
  return m?.role ?? null
}

export function listWorkspacesForUser(userId: string) {
  const db = load()
  const ids = new Set(db.workspaceMembers.filter((m) => m.userId === userId).map((m) => m.workspaceId))
  return db.workspaces.filter((w) => ids.has(w.id))
}

export function createWorkspace(input: { name: string; slug: string; ownerUserId: string }) {
  const db = load()
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (db.workspaces.some((w) => w.slug === slug)) throw new Error('slug 已存在')
  const id = `ws-${randomUUID().slice(0, 8)}`
  const workspace: Workspace = { id, name: input.name.trim(), slug, isSample: false }
  db.workspaces.push(workspace)
  db.workspaceMembers.push({ workspaceId: id, userId: input.ownerUserId, role: 'owner' })
  db.platformByWorkspace[id] = { ...defaultPlatform(), title: workspace.name, subtitle: workspace.slug }
  const agent: Agent = {
    id: `agent-${randomUUID().slice(0, 8)}`,
    workspaceId: id,
    ownerUserId: input.ownerUserId,
    name: 'Workspace Copilot',
    kind: 'personal',
    systemPrompt:
      '你是工作區助手，協助非工程使用者用 builder Skills 與 RAG 客製後台。繁中。',
    policy: {
      allowedToolPrefixes: [
        'hr:',
        'finance:',
        'sales:',
        'inventory:',
        'support:',
        'analytics:',
        'canvas:',
        'platform:',
        'bridge:',
        'agent:',
        'builder:',
      ],
      allowedMcpServers: ['notes'],
      canDelegate: false,
    },
  }
  db.agents.push(agent)
  persist()
  return { workspace, agent }
}

export function createInvite(input: {
  workspaceId: string
  email: string
  role: WorkspaceRole
}) {
  const db = load()
  const token = randomUUID().replace(/-/g, '')
  const invite: WorkspaceInvite = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
  }
  db.workspaceInvites.push(invite)
  persist()
  return invite
}

export function acceptInvite(token: string, userId: string) {
  const db = load()
  const invite = db.workspaceInvites.find((i) => i.token === token && !i.acceptedAt)
  if (!invite) throw new Error('邀請無效')
  if (new Date(invite.expiresAt) < new Date()) throw new Error('邀請已過期')
  if (!db.workspaceMembers.some((m) => m.workspaceId === invite.workspaceId && m.userId === userId)) {
    db.workspaceMembers.push({ workspaceId: invite.workspaceId, userId, role: invite.role })
  }
  invite.acceptedAt = new Date().toISOString()
  persist()
  return invite
}

export function findUserByEmail(email: string) {
  return load().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null
}

export function listUsers() {
  return load().users
}

export function listPendingInvites(workspaceId: string) {
  return load().workspaceInvites.filter((i) => i.workspaceId === workspaceId && !i.acceptedAt)
}

export function resolveSession(userId?: string, workspaceId?: string, agentId?: string): SessionContext {
  const db = load()
  const user = db.users.find((u) => u.id === userId) ?? db.users[0]
  let workspace = db.workspaces.find((w) => w.id === workspaceId) ?? null
  if (workspace && !getMemberRole(workspace.id, user.id)) workspace = null
  if (!workspace) {
    const allowed = listWorkspacesForUser(user.id)
    workspace = allowed[0] ?? db.workspaces[0]
  }
  const inWorkspace = db.agents.filter((a) => a.workspaceId === workspace.id)
  const agent =
    inWorkspace.find((a) => a.id === agentId) ??
    inWorkspace.find((a) => a.kind === 'personal') ??
    inWorkspace[0]
  if (!agent) {
    throw new Error(`工作區 ${workspace.id} 尚未設定 Agent`)
  }
  return { user, workspace, activeAgentId: agent.id }
}

export function getWorkspacePlatform(workspaceId: string): PlatformConfig {
  const db = load()
  return db.platformByWorkspace[workspaceId] ?? defaultPlatform()
}

export function setWorkspacePlatform(workspaceId: string, platform: PlatformConfig) {
  const db = load()
  db.platformByWorkspace[workspaceId] = platform
  persist()
}

export function listAgents(workspaceId: string) {
  return load().agents.filter((a) => a.workspaceId === workspaceId)
}

export function getAgent(agentId: string) {
  return load().agents.find((a) => a.id === agentId) ?? null
}

export function appendRunNodes(nodes: RunNode[]) {
  const db = load()
  db.runNodes.push(...nodes)
  if (db.runNodes.length > 2000) db.runNodes = db.runNodes.slice(-2000)
  persist()
}

export function getRunTree(runId: string) {
  return load().runNodes.filter((n) => n.runId === runId)
}

export function listRecentRuns(workspaceId: string, limit = 20) {
  const nodes = load().runNodes.filter((n) => n.workspaceId === workspaceId)
  const runIds = [...new Set(nodes.map((n) => n.runId))].slice(-limit)
  return runIds.map((runId) => ({ runId, nodes: nodes.filter((n) => n.runId === runId) }))
}

export function listBlockPackages(workspaceId: string) {
  return load().blockPackages.filter((b) => b.workspaceId === workspaceId)
}

export function upsertBlockPackage(pkg: BlockPackage) {
  const db = load()
  const idx = db.blockPackages.findIndex((b) => b.id === pkg.id)
  if (idx >= 0) db.blockPackages[idx] = pkg
  else db.blockPackages.push(pkg)
  persist()
}

export function getPublishedBlockPackages(workspaceId: string) {
  return load().blockPackages.filter((b) => b.workspaceId === workspaceId && b.status === 'published')
}

export { defaultPlatform }
