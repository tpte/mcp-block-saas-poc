import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
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
import { storagePut, storageRenameWorkspace } from '../storage/workspaceStorage.ts'
import { WORKSPACE_TEMPLATES } from '../../shared/workspaceTemplates.ts'
import { MANIFEST_FILENAME } from '../../shared/workspaceManifest.ts'

const LEGACY_WORKSPACE_ID = 'ws-hiyen'
const COMPANY_WORKSPACE_ID = 'ws-company'
const LEGACY_AGENT_ID = 'agent-hiyen-personal'
const COMPANY_AGENT_ID = 'agent-company-copilot'
const BRANDING_VERSION = 4

const COMPANY_AGENT_PROMPT =
  '你是此工作區的營運後台夥伴。使用者可能不懂程式；用 builder Skills 與 RAG 引導（資料源、模組、畫布），模板只在使用者要還原時套用。繁中。'

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
  brandingVersion?: number
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
  const wsPersonal: Workspace = { id: 'ws-personal', name: '開發者工作台', slug: 'personal', isSample: false }
  const wsSample: Workspace = { id: 'ws-sample', name: '模組範例', slug: 'sample-erp', isSample: true }
  const wsCompany: Workspace = {
    id: COMPANY_WORKSPACE_ID,
    name: '營運後台範例',
    slug: 'company',
    isSample: false,
  }

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
      '你是開發者工作區的助手，可存取工作區內允許的所有 tools。協助 manifest、MCP、Workbench 與 builder Skills。繁中。',
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
    JSON.stringify({ template: 'document', body: '這是已發布的 Block 套件範例。' }),
  )

  const companyPersonal: Agent = {
    ...personalAgent,
    id: COMPANY_AGENT_ID,
    workspaceId: wsCompany.id,
    name: '營運 Copilot',
    systemPrompt: COMPANY_AGENT_PROMPT,
  }

  const samplePersonal: Agent = {
    ...personalAgent,
    id: 'agent-sample-personal',
    workspaceId: wsSample.id,
    name: '模組範例 Copilot',
    systemPrompt: '你是模組範例工作區的助手。協助查看內建範例資料與模組。繁中。',
  }

  return {
    users: [userAlan, userDemo],
    workspaces: [wsPersonal, wsSample, wsCompany],
    agents: [orchestrator, workerHr, workerFinance, personalAgent, companyPersonal, samplePersonal],
    platformByWorkspace: {
      [wsPersonal.id]: { ...defaultPlatform(), moduleSidebarEnabled: true },
      [wsSample.id]: {
        ...defaultPlatform(),
        title: '模組範例',
        subtitle: '內建範例資料，用於體驗模組',
      },
      [wsCompany.id]: {
        ...defaultPlatform(),
        title: '營運後台',
        subtitle: '公司模組與資料源 · Skills 引導',
        modulePillsEnabled: true,
      },
    },
    mcpMounts: [],
    blockPackages: [demoPkg],
    runNodes: [],
    workspaceMembers: [
      { workspaceId: wsPersonal.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsPersonal.id, userId: userDemo.id, role: 'member' },
      { workspaceId: wsSample.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsCompany.id, userId: userAlan.id, role: 'owner' },
      { workspaceId: wsCompany.id, userId: userDemo.id, role: 'member' },
    ],
    workspaceInvites: [],
    brandingVersion: BRANDING_VERSION,
  }
}

function writeCompanyStarterManifest(workspaceId: string, displayName: string, platform: PlatformConfig) {
  const tpl = WORKSPACE_TEMPLATES['company-starter'].manifest
  const manifest = {
    ...tpl,
    revision: 1,
    displayName,
    ui: {
      ...tpl.ui,
      platform: { ...tpl.ui.platform, ...platform, modulePillsEnabled: true },
      spaceProfile: 'cockpit' as const,
      cockpit: tpl.ui.cockpit,
    },
  }
  storagePut(workspaceId, MANIFEST_FILENAME, JSON.stringify(manifest, null, 2))
}

function ensureCompanyOpsManifest(db: DbShape): boolean {
  const company = db.workspaces.find((w) => w.slug === 'company')
  if (!company) return false
  const path = join(DATA_DIR, 'storage', company.id, MANIFEST_FILENAME)
  const plat = db.platformByWorkspace[company.id]
  if (!existsSync(path)) {
    writeCompanyStarterManifest(company.id, company.name, plat ?? defaultPlatform())
    return true
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as {
      ui?: { spaceProfile?: string; cockpit?: unknown }
      modules?: { enabledCatalogIds?: string[] }
      revision?: number
    }
    const ids = raw.modules?.enabledCatalogIds?.length ?? 0
    const hasCockpit =
      raw.ui?.spaceProfile === 'cockpit' && raw.ui?.cockpit != null
    if (hasCockpit && ids >= 4) return false
    const tpl = WORKSPACE_TEMPLATES['company-starter'].manifest
    const next = {
      ...tpl,
      revision: (raw.revision ?? 1) + 1,
      displayName: company.name,
      ui: {
        ...tpl.ui,
        platform: { ...tpl.ui.platform, ...(plat ?? {}), modulePillsEnabled: true },
        spaceProfile: 'cockpit' as const,
        cockpit: tpl.ui.cockpit,
      },
    }
    writeFileSync(path, JSON.stringify(next, null, 2), 'utf8')
    return true
  } catch {
    writeCompanyStarterManifest(company.id, company.name, plat ?? defaultPlatform())
    return true
  }
}

function remapWorkspaceId(db: DbShape, oldId: string, newId: string) {
  for (const ws of db.workspaces) {
    if (ws.id === oldId) ws.id = newId
  }
  for (const a of db.agents) {
    if (a.workspaceId === oldId) a.workspaceId = newId
  }
  for (const m of db.workspaceMembers) {
    if (m.workspaceId === oldId) m.workspaceId = newId
  }
  for (const p of db.blockPackages) {
    if (p.workspaceId === oldId) p.workspaceId = newId
  }
  for (const n of db.runNodes) {
    if (n.workspaceId === oldId) n.workspaceId = newId
  }
  if (db.platformByWorkspace[oldId]) {
    db.platformByWorkspace[newId] = db.platformByWorkspace[oldId]
    delete db.platformByWorkspace[oldId]
  }
}

function patchManifestBranding(workspaceId: string) {
  const path = join(DATA_DIR, 'storage', workspaceId, 'manifest.json')
  if (!existsSync(path)) return
  try {
    const raw = readFileSync(path, 'utf8')
    if (!/hiyen/i.test(raw)) return
    const next = raw
      .replace(/HIYEN/g, '營運後台')
      .replace(/hiyen/g, 'company')
    writeFileSync(path, next, 'utf8')
  } catch {
    /* ignore */
  }
}

function migrateLegacyBranding(db: DbShape): boolean {
  if ((db.brandingVersion ?? 0) >= BRANDING_VERSION) return false

  const legacyWs = db.workspaces.find((w) => w.id === LEGACY_WORKSPACE_ID || w.slug === 'hiyen')
  if (legacyWs) {
    legacyWs.name = '營運後台範例'
    legacyWs.slug = 'company'
    if (legacyWs.id === LEGACY_WORKSPACE_ID) {
      remapWorkspaceId(db, LEGACY_WORKSPACE_ID, COMPANY_WORKSPACE_ID)
      storageRenameWorkspace(LEGACY_WORKSPACE_ID, COMPANY_WORKSPACE_ID)
      const opsOld = join(DATA_DIR, 'ops', `${LEGACY_WORKSPACE_ID}.jsonl`)
      const opsNew = join(DATA_DIR, 'ops', `${COMPANY_WORKSPACE_ID}.jsonl`)
      if (existsSync(opsOld) && !existsSync(opsNew)) {
        try {
          renameSync(opsOld, opsNew)
        } catch {
          /* ignore */
        }
      }
      patchManifestBranding(COMPANY_WORKSPACE_ID)
    }
  }

  const companyWs = db.workspaces.find((w) => w.id === COMPANY_WORKSPACE_ID || w.slug === 'company')
  if (companyWs) {
    companyWs.name = '營運後台範例'
    companyWs.slug = 'company'
    const plat = db.platformByWorkspace[companyWs.id]
    if (plat) {
      plat.title = '營運後台'
      plat.subtitle = '公司模組與資料源 · Skills 引導'
    }
  }

  for (const a of db.agents) {
    if (a.id === LEGACY_AGENT_ID) {
      a.id = COMPANY_AGENT_ID
    }
    if (a.workspaceId === COMPANY_WORKSPACE_ID || a.id === COMPANY_AGENT_ID) {
      if (/HIYEN/i.test(a.name)) a.name = '營運 Copilot'
      if (/HIYEN/i.test(a.systemPrompt)) a.systemPrompt = COMPANY_AGENT_PROMPT
    }
  }

  const personal = db.workspaces.find((w) => w.slug === 'personal')
  if (personal && personal.name.includes('駕駛艙')) {
    personal.name = '開發者工作台'
  }

  const sample = db.workspaces.find((w) => w.slug === 'sample-erp')
  if (sample) {
    if (sample.name.includes('Sample') || sample.name.includes('示範 ERP')) {
      sample.name = '模組範例'
    }
    const plat = db.platformByWorkspace[sample.id]
    if (plat) {
      plat.title = '模組範例'
      plat.subtitle = '內建範例資料，用於體驗模組'
    }
  }

  const personalPlat = db.platformByWorkspace[db.workspaces.find((w) => w.slug === 'personal')?.id ?? '']
  if (personalPlat) personalPlat.moduleSidebarEnabled = true

  const companyId = db.workspaces.find((w) => w.slug === 'company')?.id
  if (companyId && db.platformByWorkspace[companyId]) {
    db.platformByWorkspace[companyId].modulePillsEnabled = true
  }

  db.brandingVersion = BRANDING_VERSION
  return true
}

function seedCompanyManifestIfNeeded(db: DbShape) {
  const company = db.workspaces.find((w) => w.slug === 'company')
  if (!company) return
  const path = join(DATA_DIR, 'storage', company.id, MANIFEST_FILENAME)
  if (!existsSync(path)) {
    writeCompanyStarterManifest(
      company.id,
      company.name,
      db.platformByWorkspace[company.id] ?? defaultPlatform(),
    )
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
    seedCompanyManifestIfNeeded(cache)
    persist()
    return cache
  }
  cache = JSON.parse(readFileSync(DB_PATH, 'utf8')) as DbShape
  if (!Array.isArray(cache.workspaceInvites)) cache.workspaceInvites = []
  if (!cache.workspaces.some((w) => w.slug === 'company')) {
    const fresh = seed()
    const company = fresh.workspaces.find((w) => w.slug === 'company')!
    cache.workspaces.push(company)
    cache.platformByWorkspace[company.id] = fresh.platformByWorkspace[company.id]!
    cache.agents.push(...fresh.agents.filter((a) => a.workspaceId === company.id))
    cache.workspaceMembers.push(...fresh.workspaceMembers.filter((m) => m.workspaceId === company.id))
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
  if (migrateLegacyBranding(cache)) persist()
  if (ensureCompanyOpsManifest(cache)) {
    /* manifest only */
  }
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
