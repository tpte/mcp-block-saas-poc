import { SESSION_STORAGE_KEY } from '../../shared/product.ts'

/** 舊版 key：不再讀取，載入時直接清掉。 */
const LEGACY_STORAGE_KEY = 'super-mcp-session'
/** 管理員 token（只存在這台瀏覽器的 localStorage，以 Bearer 送出）。 */
export const ADMIN_TOKEN_STORAGE_KEY = 'matrix-admin-token'

export type ClientSession = {
  userId: string
  workspaceId: string
  agentId: string
}

/** 不再預設任何真實使用者：生產由伺服器發訪客 id，本機 dev 由伺服器決定預設身份。 */
const DEFAULT: ClientSession = {
  userId: '',
  workspaceId: '',
  agentId: '',
}

function clearLegacyStorage() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function loadClientSession(): ClientSession {
  clearLegacyStorage()
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    let session = { ...DEFAULT, ...JSON.parse(raw) } as ClientSession
    if (session.agentId === 'agent-orch' && session.workspaceId === 'ws-personal') {
      session = { ...session, agentId: 'agent-personal' }
      saveClientSession(session)
    }
    return session
  } catch {
    return { ...DEFAULT }
  }
}

export function saveClientSession(session: ClientSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearClientSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function loadAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function saveAdminToken(token: string) {
  const value = token.trim()
  if (value) localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, value)
  else localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function sessionHeaders(session: ClientSession = loadClientSession()) {
  const headers: Record<string, string> = {}
  if (session.userId) headers['X-User-Id'] = session.userId
  if (session.workspaceId) headers['X-Workspace-Id'] = session.workspaceId
  if (session.agentId) headers['X-Agent-Id'] = session.agentId
  const admin = loadAdminToken()
  if (admin) headers.Authorization = `Bearer ${admin}`
  return headers
}
