import { createHash, timingSafeEqual } from 'node:crypto'
import type { Context } from 'hono'
import type { SessionContext } from '../shared/domain.ts'

/**
 * dev：本機開發，信任 X-User-Id（保留 Demo 身份切換），所有請求視為 admin。
 * guest：生產預設；只接受已發放的訪客 id，管理操作需 Bearer MATRIX_ADMIN_TOKEN。
 */
export type AuthMode = 'dev' | 'guest'

export function authMode(): AuthMode {
  const raw = process.env.MATRIX_AUTH_MODE?.trim()
  if (raw === 'dev' || raw === 'guest') return raw
  return process.env.NODE_ENV === 'production' ? 'guest' : 'dev'
}

export function adminTokenConfigured() {
  return Boolean(process.env.MATRIX_ADMIN_TOKEN?.trim())
}

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

/** 常數時間比對 Authorization: Bearer <MATRIX_ADMIN_TOKEN>；未設定 token 時一律 false（fail closed）。 */
export function isAdminAuthorization(header: string | undefined): boolean {
  const expected = process.env.MATRIX_ADMIN_TOKEN?.trim()
  if (!expected || !header) return false
  const m = header.match(/^Bearer\s+(.+)$/i)
  if (!m) return false
  return timingSafeEqual(digest(m[1].trim()), digest(expected))
}

export class AuthError extends Error {
  status: 401 | 403
  code: string
  constructor(status: 401 | 403, code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

export const ADMIN_REQUIRED_MESSAGE = '需要管理員 token（Authorization: Bearer MATRIX_ADMIN_TOKEN）'

/** 回傳 403 Response；session 為 admin 時回 null。 */
export function denyUnlessAdmin(c: Context, session: SessionContext): Response | null {
  if (session.isAdmin) return null
  return c.json({ error: ADMIN_REQUIRED_MESSAGE, code: 'admin_required' }, 403)
}

export function assertAdmin(session: SessionContext) {
  if (!session.isAdmin) throw new AuthError(403, 'admin_required', ADMIN_REQUIRED_MESSAGE)
}

export function clientIp(c: Context) {
  const fwd = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd || c.req.header('x-real-ip') || 'local'
}
