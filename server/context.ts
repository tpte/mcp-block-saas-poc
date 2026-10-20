import type { Context } from 'hono'
import type { SessionContext } from '../shared/domain.ts'
import { AuthError, authMode, isAdminAuthorization } from './auth.ts'
import { isActiveGuest, resolveSession } from './db/store.ts'

/**
 * 解析請求身份。
 * - dev 模式或帶有效 admin token：沿用 X-User-Id（預設第一位使用者），isAdmin=true。
 * - guest 模式：X-User-Id 必須是尚未過期的訪客 id，否則丟 401。
 */
export function sessionFromHeaders(c: Context): SessionContext {
  const userId = c.req.header('x-user-id')
  const workspaceId = c.req.header('x-workspace-id')
  const agentId = c.req.header('x-agent-id')
  if (authMode() === 'dev' || isAdminAuthorization(c.req.header('authorization'))) {
    return { ...resolveSession(userId, workspaceId, agentId), isAdmin: true, isGuest: false }
  }
  if (!userId || !isActiveGuest(userId)) {
    throw new AuthError(401, 'guest_required', '需要訪客 session（POST /api/guest/session）或管理員 token')
  }
  return { ...resolveSession(userId, workspaceId, agentId), isAdmin: false, isGuest: true }
}

export function trySessionFromHeaders(c: Context): SessionContext | null {
  try {
    return sessionFromHeaders(c)
  } catch {
    return null
  }
}
