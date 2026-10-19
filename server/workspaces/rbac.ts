import type { SessionContext, WorkspaceRole } from '../../shared/domain.ts'
import { getMemberRole, getDb } from '../db/store.ts'

const RANK: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

export class RbacError extends Error {
  status = 403
  constructor(message: string) {
    super(message)
    this.name = 'RbacError'
  }
}

export function roleOf(session: SessionContext): WorkspaceRole {
  return getMemberRole(session.workspace.id, session.user.id) ?? 'viewer'
}

export function requireMinRole(session: SessionContext, min: WorkspaceRole) {
  const role = roleOf(session)
  if (RANK[role] < RANK[min]) throw new RbacError(`需要 ${min} 以上權限（目前 ${role}）`)
  return role
}

export function canManageManifest(session: SessionContext) {
  return RANK[roleOf(session)] >= RANK.admin
}

export function canInvite(session: SessionContext) {
  return RANK[roleOf(session)] >= RANK.admin
}

export function canEditCanvas(session: SessionContext) {
  return RANK[roleOf(session)] >= RANK.member
}

export function sessionCapabilities(session: SessionContext) {
  const role = roleOf(session)
  return {
    role,
    canManageManifest: canManageManifest(session),
    canInvite: canInvite(session),
    canEditCanvas: canEditCanvas(session),
  }
}

export function assertWorkspaceMember(userId: string, workspaceId: string) {
  const role = getMemberRole(workspaceId, userId)
  if (!role) throw new RbacError('非此工作區成員')
  return role
}

export function listUsersInWorkspace(workspaceId: string) {
  const db = getDb()
  return db.workspaceMembers
    .filter((m) => m.workspaceId === workspaceId)
    .map((m) => ({
      ...m,
      user: db.users.find((u) => u.id === m.userId),
    }))
    .filter((x) => x.user)
}
