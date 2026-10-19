import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { SpaceProfile } from '../../shared/workspaceManifest.ts'
import { BlockCanvas } from '../features/canvas/BlockCanvas'
import { Composer, type ComposerHandle } from '../features/chat/Composer'
import { IdeSpaceView } from '../features/space/IdeSpaceView'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { fetchManifest } from '../mcp/client'
import type { BlockAction, UiBlock } from '../types/ui'

export function SpacePage() {
  const { slug = '' } = useParams()
  const session = useAgentSessionContext()
  const composerRef = useRef<ComposerHandle>(null)
  const [expandedBlock, setExpandedBlock] = useState<UiBlock | null>(null)
  const [spaceProfile, setSpaceProfile] = useState<SpaceProfile>('admin')
  const top = session.platform.composerPosition === 'top'
  const canEditCanvas = session.capabilities.canEditCanvas

  useEffect(() => {
    void fetchManifest()
      .then((d) => setSpaceProfile(d.manifest.ui.spaceProfile ?? 'default'))
      .catch(() => setSpaceProfile('default'))
  }, [session.clientSession.workspaceId])

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  const canvasBlock = (
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
  )

  return (
    <div className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <main
        className={
          top ? 'min-h-0 overflow-y-auto px-4 pb-4 pt-44 md:px-6' : 'min-h-0 overflow-y-auto px-4 pb-3 pt-2 md:px-6'
        }
      >
        {session.trace.length > 0 ? (
          <ol className="mx-auto mb-4 w-full max-w-6xl space-y-1 text-xs text-[var(--muted)]">
            {session.trace.map((line, index) => (
              <li key={`${line}-${index}`}>
                {session.busy && index === session.trace.length - 1 ? `▸ ${line}` : line}
              </li>
            ))}
          </ol>
        ) : null}
        {spaceProfile === 'ide' ? (
          <IdeSpaceView slug={slug} canvas={canvasBlock} />
        ) : (
          canvasBlock
        )}
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
