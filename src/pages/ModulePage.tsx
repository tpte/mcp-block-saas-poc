import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BlockCanvas } from '../features/canvas/BlockCanvas'
import { Composer, type ComposerHandle } from '../features/chat/Composer'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { useModuleCatalog } from '../features/module/useModuleCatalog'
import { useWorkspaceModules } from '../features/module/useWorkspaceModules'
import type { BlockAction, UiBlock } from '../types/ui'

export function ModulePage() {
  const { moduleId = '' } = useParams()
  const session = useAgentSessionContext()
  const composerRef = useRef<ComposerHandle>(null)
  const [expandedBlock, setExpandedBlock] = useState<UiBlock | null>(null)
  const { modules } = useWorkspaceModules(session.clientSession.workspaceId)
  const { items: catalogItems } = useModuleCatalog(session.clientSession.workspaceId, moduleId)
  const mod = modules.find((m) => m.id === moduleId)
  const top = session.platform.composerPosition === 'top'
  const canEditCanvas = session.capabilities.canEditCanvas

  useEffect(() => {
    session.setActiveModule(moduleId)
  }, [moduleId, session.setActiveModule])

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  return (
    <div className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <main
        className={
          top ? 'min-h-0 overflow-y-auto px-4 pb-6 pt-44 md:px-6' : 'min-h-0 overflow-y-auto px-4 pb-3 pt-2 md:px-6'
        }
      >
        {mod ? (
          <p className="mx-auto mb-3 max-w-6xl text-xs text-[var(--muted)]">
            MODULE · {mod.label} · MCP {mod.mcpMountId}
          </p>
        ) : null}
        {session.trace.length > 0 ? (
          <ol className="mx-auto mb-4 w-full max-w-6xl space-y-1 text-xs text-[var(--muted)]">
            {session.trace.map((line, index) => (
              <li key={`${line}-${index}`}>
                {session.busy && index === session.trace.length - 1 ? `▸ ${line}` : line}
              </li>
            ))}
          </ol>
        ) : null}
        <BlockCanvas
          canvas={session.canvas}
          platform={session.platform}
          suggestions={session.suggestions}
          onAction={handleBlockAction}
          busy={session.busy}
          onSuggest={(text) => void session.sendMessage(text)}
          focusedBlockId={session.focusedBlockId}
          onFocusBlock={session.setFocusedBlockId}
          expandedBlock={expandedBlock}
          onExpandBlock={setExpandedBlock}
          onAddTemplate={canEditCanvas ? (id) => void session.addBlockFromTemplate(id) : undefined}
          onSaveBlockProps={
            canEditCanvas ? (blockId, props) => void session.updateBlockProps(blockId, props) : undefined
          }
          onDeleteBlock={canEditCanvas ? (id) => void session.removeBlock(id) : undefined}
        />
        {catalogItems.length > 0 ? (
          <div className="mx-auto mt-4 flex max-w-6xl flex-wrap gap-2">
            {catalogItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs"
                onClick={() => void session.runMcpInvoke(item.tool, item.defaultPayload)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </main>
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
