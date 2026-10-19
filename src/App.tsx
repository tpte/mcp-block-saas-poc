import { BlockCanvas } from './features/canvas/BlockCanvas'
import { Composer } from './features/chat/Composer'
import { useAgentSession } from './features/session/useAgentSession'
import { AppShell } from './layout/AppShell'
import type { BlockAction } from './types/ui'

export default function App() {
  const session = useAgentSession()
  const top = session.platform.composerPosition === 'top'

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  return (
    <AppShell
      health={session.health}
      platform={session.platform}
      lastProvider={session.lastProvider}
      offline={session.offline}
    >
      <main className={top ? 'min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-44' : 'min-h-0 flex-1 overflow-y-auto px-6 pb-48 pt-2'}>
        <BlockCanvas
          canvas={session.canvas}
          platform={session.platform}
          suggestions={session.suggestions}
          onAction={handleBlockAction}
          onSuggest={(text) => void session.sendMessage(text)}
        />
      </main>
      <Composer
        messages={session.messages}
        platform={session.platform}
        suggestions={session.suggestions}
        busy={session.busy}
        onSend={(text) => void session.sendMessage(text)}
      />
    </AppShell>
  )
}
