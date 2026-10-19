import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { LAST_SPACE_SLUG_KEY } from '../features/session/workspaceUiCache'
import { WorkspaceTeamPanel } from '../features/workspace/WorkspaceTeamPanel'

export function MePage() {
  const session = useAgentSessionContext()
  const user = session.devUsers.find((u) => u.id === session.clientSession.userId)
  const [teamOpen, setTeamOpen] = useState(false)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <h1 className="text-lg font-semibold">我</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">身份、成員，以及進階調整</p>

      <section className="mt-6 max-w-md space-y-4 rounded-xl border border-[var(--line)] p-4">
        <div>
          <p className="text-xs text-[var(--muted)]">使用者</p>
          <p className="font-medium">{user?.displayName ?? session.clientSession.userId}</p>
          <p className="text-xs text-[var(--muted)]">{user?.email}</p>
        </div>

        {session.agents.length > 1 ? (
          <label className="block text-sm">
            <span className="text-xs text-[var(--muted)]">預設 Agent</span>
            <select
              className="mt-1 w-full rounded border border-[var(--line)] bg-[var(--card)] px-2 py-2 text-sm"
              value={session.clientSession.agentId}
              onChange={(e) => session.selectAgent(e.target.value)}
            >
              {session.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {session.devUsers.length > 1 ? (
          <label className="block text-sm">
            <span className="text-xs text-[var(--muted)]">Demo 身份（RBAC 測試）</span>
            <select
              className="mt-1 w-full rounded border border-[var(--line)] bg-[var(--card)] px-2 py-2 text-sm"
              value={session.clientSession.userId}
              onChange={(e) => session.selectUser(e.target.value)}
            >
              {session.devUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">成員</p>
            <p className="text-xs text-[var(--muted)]">邀請或接受加入目前工作區</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setTeamOpen(true)}>
            管理
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">工作區</p>
          <ul className="space-y-2 text-sm">
            {session.workspaces.map((ws) => (
              <li key={ws.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{ws.name}</span>
                <span className="flex shrink-0 gap-3">
                  <Link className="text-xs text-cyan-700 dark:text-cyan-400" to={`/w/${ws.slug}`}>
                    開啟
                  </Link>
                  <Link className="text-xs text-[var(--muted)]" to={`/w/${ws.slug}/studio`}>
                    調整
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to={`/w/${localStorage.getItem(LAST_SPACE_SLUG_KEY) ?? session.workspaces[0]?.slug ?? 'personal'}`}
          className="inline-block text-sm text-cyan-700 hover:underline dark:text-cyan-400"
        >
          回到最近的工作區 →
        </Link>
      </section>
      <WorkspaceTeamPanel
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        workspaceId={session.clientSession.workspaceId}
        canInvite={session.capabilities.canInvite}
        members={session.workspaceMembers}
        onAccepted={() => void session.refreshBackend()}
        onFlash={session.showFlash}
      />
    </div>
  )
}
