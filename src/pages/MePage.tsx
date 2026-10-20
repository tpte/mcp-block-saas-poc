import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { LAST_SPACE_SLUG_KEY } from '../features/session/workspaceUiCache'
import { WorkspaceCreateForm } from '../features/workspace/WorkspaceCreateForm'
import { WorkspaceTeamPanel } from '../features/workspace/WorkspaceTeamPanel'
import { clearClientSession, loadAdminToken, saveAdminToken } from '../session/apiHeaders'

export function MePage() {
  const navigate = useNavigate()
  const session = useAgentSessionContext()
  const user = session.devUsers.find((u) => u.id === session.clientSession.userId)
  const [teamOpen, setTeamOpen] = useState(false)
  const [adminToken, setAdminToken] = useState(loadAdminToken)
  const devMode = session.health?.auth?.mode !== 'guest'
  const isGuest = Boolean(session.health?.auth?.isGuest)
  const isAdmin = Boolean(session.health?.auth?.isAdmin)

  if (!session.bootstrapped && !session.offline) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm font-medium">載入帳戶與工作區…</p>
        <p className="mt-1 text-xs text-[var(--muted)]">身份與成員資料來自伺服器 session。</p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <h1 className="text-lg font-semibold">我</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">身份、成員，以及進階調整</p>

      <section className="mt-6 max-w-md space-y-4 rounded-xl border border-[var(--line)] p-4">
        <div>
          <p className="text-xs text-[var(--muted)]">使用者</p>
          <p className="font-medium">{isGuest ? '訪客' : (user?.displayName ?? (isAdmin ? '管理員' : session.clientSession.userId))}</p>
          <p className="text-xs text-[var(--muted)]">
            {isGuest ? '訪客沙盒：資料只屬於這個瀏覽器，24 小時後自動清除。' : user?.email}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            此工作區角色：{session.capabilities.role}
            {session.capabilities.canInvite ? ' · 可邀請成員' : ''}
          </p>
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
            {session.clientSession.agentId === 'agent-orch' ? (
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                日常對話建議選 Personal Copilot；中心調度留給跨模組任務。
              </p>
            ) : null}
          </label>
        ) : null}

        {devMode && session.devUsers.length > 1 ? (
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

        {!devMode ? (
          <form
            className="block text-sm"
            onSubmit={(e) => {
              e.preventDefault()
              saveAdminToken(adminToken)
              // 換身份：清掉目前（訪客）session，套用 token 後由伺服器回到管理員預設工作區；移除 token 則重新拿訪客沙盒。
              clearClientSession()
              void session.refreshBackend()
              session.showFlash(adminToken.trim() ? '已套用管理員 token' : '已移除管理員 token', 'ok')
            }}
          >
            <span className="text-xs text-[var(--muted)]">管理員 token（只存在這個瀏覽器）</span>
            <div className="mt-1 flex gap-2">
              <input
                type="password"
                autoComplete="off"
                className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="MATRIX_ADMIN_TOKEN"
              />
              <Button type="submit" size="sm" variant="outline">
                套用
              </Button>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {isAdmin ? '目前以管理員身份操作。' : '修改 manifest、邀請成員、營運紀錄與外殼設定需要管理員 token。'}
            </p>
          </form>
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
            {session.workspaces.map((ws) => {
              const active = ws.id === session.clientSession.workspaceId
              return (
                <li
                  key={ws.id}
                  className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 ${active ? 'bg-[var(--line)]/30' : ''}`}
                >
                  <span className="min-w-0 truncate">
                    {ws.name}
                    {ws.isSample ? <span className="ml-1 text-[10px] text-[var(--muted)]">範例</span> : null}
                    {active ? <span className="ml-1 text-[10px] text-[var(--muted)]">目前</span> : null}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      className="text-xs text-cyan-700 dark:text-cyan-400"
                      onClick={() => {
                        session.switchWorkspace(ws.id, ws.slug)
                        navigate(`/w/${ws.slug}`)
                      }}
                    >
                      開啟
                    </button>
                    <Link className="text-xs text-[var(--muted)]" to={`/w/${ws.slug}/studio?focus=workbench`}>
                      工作台
                    </Link>
                  </span>
                </li>
              )
            })}
          </ul>
          <WorkspaceCreateForm
            onCreated={(workspace) => {
              session.switchWorkspace(workspace.id, workspace.slug)
              void session.refreshBackend()
            }}
            onFlash={session.showFlash}
          />
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
