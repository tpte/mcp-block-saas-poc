import type { Context } from 'hono'
import type { SessionContext } from '../shared/domain.ts'
import { resolveSession } from './db/store.ts'

export function sessionFromHeaders(c: Context): SessionContext {
  const userId = c.req.header('x-user-id')
  const workspaceId = c.req.header('x-workspace-id')
  const agentId = c.req.header('x-agent-id')
  return resolveSession(userId, workspaceId, agentId)
}
