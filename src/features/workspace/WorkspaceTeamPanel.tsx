import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
  fetchWorkspaceInvites,
  type SessionMember,
  type WorkspaceInviteRow,
} from '../../mcp/client'

type Props = {
  open: boolean
  onClose: () => void
  workspaceId: string
  canInvite: boolean
  members: SessionMember[]
  onAccepted: () => void
  onFlash: (text: string, variant?: 'error' | 'ok') => void
}

export function WorkspaceTeamPanel({
  open,
  onClose,
  workspaceId,
  canInvite,
  members,
  onAccepted,
  onFlash,
}: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [invites, setInvites] = useState<WorkspaceInviteRow[]>([])
  const [acceptToken, setAcceptToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastToken, setLastToken] = useState<string | null>(null)

  const reloadInvites = useCallback(() => {
    if (!canInvite) return
    void fetchWorkspaceInvites(workspaceId)
      .then((d) => setInvites(d.invites))
      .catch(() => setInvites([]))
  }, [canInvite, workspaceId])

  useEffect(() => {
    if (!open) return
    reloadInvites()
  }, [open, reloadInvites])

  if (!open) return null

  async function sendInvite() {
    if (!email.trim()) return
    setBusy(true)
    try {
      const res = await createWorkspaceInvite(workspaceId, email.trim(), role)
      setLastToken(res.token)
      setEmail('')
      onFlash(`已建立邀請（${res.invite.email}）`, 'ok')
      reloadInvites()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '邀請失敗')
    } finally {
      setBusy(false)
    }
  }

  async function acceptInvite() {
    if (!acceptToken.trim()) return
    setBusy(true)
    try {
      await acceptWorkspaceInvite(acceptToken.trim())
      setAcceptToken('')
      onFlash('已加入工作區', 'ok')
      onAccepted()
      onClose()
    } catch (err) {
      onFlash(err instanceof Error ? err.message : '接受邀請失敗')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="team-panel-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--card)] p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="team-panel-title" className="text-sm font-semibold">
            團隊與邀請
          </h2>
          <button type="button" className="text-xs text-[var(--muted)]" onClick={onClose}>
            關閉
          </button>
        </div>

        <section className="mb-4">
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">成員（{members.length}）</p>
          <ul className="space-y-1 text-xs">
            {members.map((m) => (
              <li key={m.userId} className="flex justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--line)]/30">
                <span>{m.user?.displayName ?? m.userId}</span>
                <span className="text-[var(--muted)]">{m.role}</span>
              </li>
            ))}
          </ul>
        </section>

        {canInvite ? (
          <section className="mb-4 space-y-2 border-t border-[var(--line)] pt-3">
            <p className="text-xs font-medium text-[var(--muted)]">邀請員工</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
                <option value="viewer">viewer</option>
              </select>
              <Button type="button" size="sm" disabled={busy} onClick={() => void sendInvite()}>
                送出邀請
              </Button>
            </div>
            {lastToken ? (
              <p className="break-all rounded bg-[var(--bg)] p-2 font-mono text-[10px] text-[var(--muted)]">
                邀請 token（PoC）：{lastToken}
              </p>
            ) : null}
            {invites.length > 0 ? (
              <ul className="text-[10px] text-[var(--muted)]">
                {invites.map((i) => (
                  <li key={i.id}>
                    待接受 · {i.email} · {i.role}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : (
          <p className="mb-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
            目前身份無法發送邀請（需 admin 以上）。
          </p>
        )}

        <section className="space-y-2 border-t border-[var(--line)] pt-3">
          <p className="text-xs font-medium text-[var(--muted)]">接受邀請</p>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs"
              placeholder="貼上 invite token"
              value={acceptToken}
              onChange={(e) => setAcceptToken(e.target.value)}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void acceptInvite()}>
              接受
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
