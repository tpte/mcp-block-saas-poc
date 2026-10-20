import type { PlatformConfig } from './platform.ts'

export type User = {
  id: string
  email: string
  displayName: string
  /** 訪客沙盒：到期後由 sweep 清除（ISO 時間）。 */
  guestExpiresAt?: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Workspace = {
  id: string
  name: string
  slug: string
  isSample: boolean
  /** 訪客沙盒工作區所屬的 guest user id；slug 只在該訪客的清單內唯一。 */
  guestOwnerId?: string
}

export type WorkspaceMember = {
  workspaceId: string
  userId: string
  role: WorkspaceRole
}

export type WorkspaceInvite = {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  token: string
  createdAt: string
  expiresAt: string
  acceptedAt?: string
}

export type AgentKind = 'orchestrator' | 'worker' | 'personal'

export type AgentPolicy = {
  allowedToolPrefixes: string[]
  allowedMcpServers: string[]
  canDelegate: boolean
}

export type Agent = {
  id: string
  workspaceId: string
  ownerUserId: string
  name: string
  kind: AgentKind
  systemPrompt: string
  policy: AgentPolicy
  platformOverrides?: Partial<PlatformConfig>
}

export type McpMountRecord = {
  id: string
  workspaceId: string
  name: string
  transport: 'stdio' | 'inprocess'
  configJson: string
  enabled: boolean
}

export type BlockPackageStatus = 'pending' | 'approved' | 'published' | 'rejected'

export type BlockPackage = {
  id: string
  workspaceId: string
  authorUserId: string
  name: string
  version: string
  componentId: string
  propsSchemaJson: string
  bundlePath: string
  status: BlockPackageStatus
  createdAt: string
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
  payloadJson?: string
  source: 'invoke' | 'chat'
  durationMs: number
  ok: boolean
  error?: string | null
  createdAt: string
}

export type SessionContext = {
  user: User
  workspace: Workspace
  activeAgentId: string
  /** 帶有效 MATRIX_ADMIN_TOKEN（或本機 dev 模式）才為 true。 */
  isAdmin?: boolean
  /** 生產環境的匿名訪客沙盒。 */
  isGuest?: boolean
}

export type BillingUsageRecord = {
  workspaceId: string
  period: string
  llmTokens: number
  invokeCount: number
  storageBytes: number
  computeMs: number
}
