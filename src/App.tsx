import { BlockCanvas } from './features/canvas/BlockCanvas'
import { ChatPanel } from './features/chat/ChatPanel'
import { MODULES, useAgentSession } from './features/session/useAgentSession'
import { AppShell } from './layout/AppShell'
import type { BlockAction } from './types/ui'

export default function App() {
  const session = useAgentSession()
  const active = MODULES.find((m) => m.id === session.activeModule)
  const prompts = active?.prompts ?? MODULES[0].prompts

  async function handleSelectModule(id: string, tool?: string) {
    session.setActiveModule(id)
    if (id === 'home') {
      await session.loadDashboard()
      return
    }
    if (tool) await session.runMcpInvoke(tool)
  }

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  return (
    <AppShell
      health={session.health}
      lastProvider={session.lastProvider}
      activeModule={session.activeModule}
      busy={session.busy}
      onSelectModule={(id, tool) => void handleSelectModule(id, tool)}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ChatPanel
          messages={session.messages}
          busy={session.busy}
          modulePrompts={prompts}
          onSend={(text) => void session.sendMessage(text)}
        />
        <BlockCanvas blocks={session.blocks} onAction={handleBlockAction} />
      </div>
      <section className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
        <h2 className="text-sm font-semibold">Event Log</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
          {session.log.length === 0 ? <li>—</li> : session.log.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </AppShell>
  )
}
