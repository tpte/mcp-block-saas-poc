import { useRef } from 'react'
import { MatrixHomeHero } from '../features/home/MatrixHomeHero'
import { Composer, type ComposerHandle } from '../features/chat/Composer'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'

export function HomePage() {
  const session = useAgentSessionContext()
  const composerRef = useRef<ComposerHandle>(null)
  const ws = session.workspaces.find((w) => w.id === session.clientSession.workspaceId)

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <MatrixHomeHero workspaceName={ws?.name ?? session.health?.session?.workspaceName} />
      <Composer
        ref={composerRef}
        messages={session.messages}
        platform={session.platform}
        suggestions={session.suggestions}
        busy={session.busy}
        onSend={(text) => void session.sendMessage(text)}
      />
    </div>
  )
}
