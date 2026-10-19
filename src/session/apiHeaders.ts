import { SESSION_STORAGE_KEY } from '../../shared/product.ts'

const LEGACY_STORAGE_KEY = 'super-mcp-session'

export type ClientSession = {
  userId: string
  workspaceId: string
  agentId: string
  /** Active MODULE page; omitted on MATRIX home */
  activeModuleId?: string
}

const DEFAULT: ClientSession = {
  userId: 'user-alan',
  workspaceId: 'ws-personal',
  agentId: 'agent-personal',
}

export function loadClientSession(): ClientSession {
  try {
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const session = { ...DEFAULT, ...JSON.parse(raw) } as ClientSession
    if (localStorage.getItem(LEGACY_STORAGE_KEY) && !localStorage.getItem(SESSION_STORAGE_KEY)) {
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

export function sessionHeaders(session: ClientSession = loadClientSession()) {
  const headers: Record<string, string> = {
    'X-User-Id': session.userId,
    'X-Workspace-Id': session.workspaceId,
    'X-Agent-Id': session.agentId,
  }
  if (session.activeModuleId) headers['X-Module-Id'] = session.activeModuleId
  return headers
}
