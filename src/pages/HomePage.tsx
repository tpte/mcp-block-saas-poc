import { MatrixHomeHero } from '../features/home/MatrixHomeHero'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'

export function HomePage() {
  const session = useAgentSessionContext()
  const ws = session.workspaces.find((w) => w.id === session.clientSession.workspaceId)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MatrixHomeHero
        workspaceName={ws?.name ?? session.health?.session?.workspaceName}
        workspaces={session.workspaces}
      />
    </div>
  )
}
