import { Link } from 'react-router-dom'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { LAST_SPACE_SLUG_KEY } from '../features/session/workspaceUiCache'

export function MePage() {
  const session = useAgentSessionContext()
  const user = session.devUsers.find((u) => u.id === session.clientSession.userId)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <h1 className="text-lg font-semibold">個人設定</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">MATRIX 帳號與 PoC 偏好</p>

      <section className="mt-6 max-w-md space-y-4 rounded-xl border border-[var(--line)] p-4">
        <div>
          <p className="text-xs text-[var(--muted)]">使用者</p>
          <p className="font-medium">{user?.displayName ?? session.clientSession.userId}</p>
          <p className="text-xs text-[var(--muted)]">{user?.email}</p>
        </div>

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

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">你的工作區 SPACE</p>
          <ul className="space-y-1 text-sm">
            {session.workspaces.map((ws) => (
              <li key={ws.id} className="flex items-center justify-between gap-2">
                <span>{ws.name}</span>
                <Link className="text-xs text-cyan-700 dark:text-cyan-400" to={`/w/${ws.slug}`}>
                  開啟
                </Link>
                <Link className="text-xs text-[var(--muted)]" to={`/w/${ws.slug}/studio`}>
                  Studio
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to={`/w/${localStorage.getItem(LAST_SPACE_SLUG_KEY) ?? session.workspaces[0]?.slug ?? 'personal'}`}
          className="inline-block text-sm text-cyan-700 hover:underline dark:text-cyan-400"
        >
          回到最近的 SPACE →
        </Link>
      </section>
    </div>
  )
}
