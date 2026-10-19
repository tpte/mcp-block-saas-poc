import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { SpaceProfile } from '../../shared/workspaceManifest.ts'
import { BlockCanvas } from '../features/canvas/BlockCanvas'
import { Composer } from '../features/chat/Composer'
import { ConversationThread } from '../features/chat/ConversationThread'
import { fetchManifest, fetchMcpCatalog } from '../mcp/client'
import { ModuleSidebar } from '../features/module/ModuleSidebar'
import { useModuleCatalog } from '../features/module/useModuleCatalog'
import { useWorkspaceModules } from '../features/module/useWorkspaceModules'
import { IdeSpaceView } from '../features/space/IdeSpaceView'
import { SpaceOpsChrome } from '../features/space/SpaceOpsChrome'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import type { BlockAction, UiBlock } from '../types/ui'

export function SpacePage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const session = useAgentSessionContext()
  const [expandedBlock, setExpandedBlock] = useState<UiBlock | null>(null)
  const [spaceProfile, setSpaceProfile] = useState<SpaceProfile>('admin')
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false)
  const top = session.platform.composerPosition === 'top'
  const canEditCanvas = session.capabilities.canEditCanvas
  const wsId = session.clientSession.workspaceId

  const { items: catalogItems, reload: reloadCatalog } = useModuleCatalog(wsId)
  const { modules, loading: modulesLoading, reload: reloadModules } = useWorkspaceModules(wsId)

  useEffect(() => {
    void fetchManifest()
      .then((d) => setSpaceProfile(d.manifest.ui.spaceProfile ?? 'default'))
      .catch(() => setSpaceProfile('default'))
  }, [wsId])

  useEffect(() => {
    reloadCatalog()
    reloadModules()
  }, [wsId, reloadCatalog, reloadModules])

  const handleBlockAction = (action: BlockAction) => {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  const handleSelectModule = useCallback(
    async (moduleId: string) => {
      try {
        const { items } = await fetchMcpCatalog(moduleId)
        const pick = items[0]
        if (!pick) {
          session.showFlash('此模組尚無可用操作，請到 Studio 啟用工具', 'error')
          return
        }
        session.runCatalogItem(pick)
      } catch {
        session.showFlash('無法載入模組操作', 'error')
      }
    },
    [session],
  )

  const openStudio = () => navigate(`/w/${slug}/studio`)
  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('matrix:open-command-palette'))
  }

  const showSidebar = session.platform.moduleSidebarEnabled

  const canvasBlock = (
    <BlockCanvas
      canvas={session.canvas}
      canvasLoading={!session.canvasHydrated}
      platform={session.platform}
      suggestions={session.suggestions}
      onAction={handleBlockAction}
      busy={session.busy}
      onSuggest={(text) => void session.sendMessage(text)}
      focusedBlockId={session.focusedBlockId}
      onFocusBlock={session.setFocusedBlockId}
      expandedBlock={expandedBlock}
      onExpandBlock={setExpandedBlock}
      onSaveBlockProps={
        canEditCanvas ? (blockId, props) => void session.updateBlockProps(blockId, props) : undefined
      }
      onDeleteBlock={canEditCanvas ? (id) => void session.removeBlock(id) : undefined}
      opsHints={
        session.platform.modulePillsEnabled || session.platform.moduleSidebarEnabled
          ? '上方可點模組分類執行操作，或用快捷操作／⌘K。'
          : '使用上方「快捷操作」或 ⌘K 執行 HR、財務等模組，不必只靠對話。'
      }
    />
  )

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      <SpaceOpsChrome
        platform={session.platform}
        catalogItems={catalogItems}
        onRunCatalogItem={session.runCatalogItem}
        onOpenStudio={openStudio}
        onOpenCommandPalette={openPalette}
        showModuleMenuButton={showSidebar}
        onOpenModuleMenu={() => setMobileModulesOpen(true)}
      />
      <div className="flex min-h-0 overflow-hidden">
        {showSidebar ? (
          <ModuleSidebar
            modules={modules}
            modulesLoading={modulesLoading}
            onSelectModule={(id) => void handleSelectModule(id)}
            mobileOpen={mobileModulesOpen}
            onMobileClose={() => setMobileModulesOpen(false)}
          />
        ) : null}
        <div className="relative grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <main
            className={
              top ? 'min-h-0 overflow-y-auto px-4 pb-4 pt-44 md:px-6' : 'min-h-0 overflow-y-auto px-4 pb-3 pt-2 md:px-6'
            }
          >
            <ConversationThread messages={session.messages} busy={session.busy} />
            {session.busy && session.trace.length > 0 ? (
              <p className="mx-auto mb-3 w-full max-w-6xl text-xs text-[var(--muted)]">
                {session.trace[session.trace.length - 1]}
              </p>
            ) : null}
            {session.messages.length > 0 && session.canvas.blocks.length === 0
              ? null
              : spaceProfile === 'ide'
                ? <IdeSpaceView slug={slug} canvas={canvasBlock} />
                : canvasBlock}
          </main>
          <Composer
            ref={session.composerFocusRef}
            scopeId={session.clientSession.workspaceId}
            messages={session.messages}
            platform={session.platform}
            suggestions={session.suggestions}
            busy={session.busy}
            onSend={(text) => void session.sendMessage(text)}
          />
        </div>
      </div>
    </div>
  )
}
