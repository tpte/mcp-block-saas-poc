import { MatrixHomeHero } from '../features/home/MatrixHomeHero'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'

export function HomePage() {
  const session = useAgentSessionContext()
  const ws = session.workspaces.find((w) => w.id === session.clientSession.workspaceId)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MatrixHomeHero workspaceName={ws?.name ?? session.health?.session?.workspaceName} />
      <p className="shrink-0 pb-2 text-center text-xs text-[var(--muted)]">
        從下方 Dock 選擇 SPACE 開始；對話與 Block 在 SPACE 頁內進行。
      </p>
    </div>
  )
}
