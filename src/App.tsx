import { BlockCanvas } from './features/canvas/BlockCanvas'
import { Composer } from './features/chat/Composer'
import { useAgentSession } from './features/session/useAgentSession'
import { AppShell } from './layout/AppShell'
import type { BlockAction } from './types/ui'

export default function App() {
  const session = useAgentSession()

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  return (
    <AppShell health={session.health} lastProvider={session.lastProvider} offline={session.offline}>
      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-40 pt-2">
        <BlockCanvas
          canvas={session.canvas}
          onAction={handleBlockAction}
          onSuggest={(text) => void session.sendMessage(text)}
        />
      </main>
      <Composer
        messages={session.messages}
        busy={session.busy}
        onSend={(text) => void session.sendMessage(text)}
      />
    </AppShell>
  )
}
