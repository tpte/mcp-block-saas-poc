import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from './lib/useMediaQuery'
import { WorkspaceTeamPanel } from './features/workspace/WorkspaceTeamPanel'
import { BuilderHubPanel } from './features/builder/BuilderHubPanel'
import { fetchBuilderSetupContext } from './mcp/client'
import type { UiBlock } from './types/ui'
import { BlockCanvas } from './features/canvas/BlockCanvas'
import { ChatHistoryPanel } from './features/chat/ChatHistoryPanel'
import { Composer, type ComposerHandle } from './features/chat/Composer'
import { CommandPalette } from './features/command/CommandPalette'
import { AgentTopologyPanel } from './features/debug/AgentTopologyPanel'
import { OpsInsightsPanel } from './features/debug/OpsInsightsPanel'
import { ToolTracePanel } from './features/debug/ToolTracePanel'
import { installShortcutListener } from './features/keyboard/shortcutRegistry'
import { ShortcutsHelpModal } from './features/keyboard/ShortcutsHelpModal'
import { ModulePillBar } from './features/module/ModulePillBar'
import { ModuleSidebar } from './features/module/ModuleSidebar'
import { useModuleCatalog } from './features/module/useModuleCatalog'
import { useAgentSession } from './features/session/useAgentSession'
import { WorkbenchPanel } from './features/workspace/WorkbenchPanel'
import { WorkspaceMapPanel } from './features/workspace/WorkspaceMapPanel'
import { AppShell } from './layout/AppShell'
import type { BlockAction } from './types/ui'

export default function App() {
  const session = useAgentSession()
  const { items: catalogItems, loading: catalogLoading, reload: reloadCatalog } = useModuleCatalog(
    session.clientSession.workspaceId,
  )
  const isNarrow = useMediaQuery('(max-width: 767px)')
  const [mapOpen, setMapOpen] = useState(false)
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(!isNarrow)
  const composerRef = useRef<ComposerHandle>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState<UiBlock | null>(null)
  const top = session.platform.composerPosition === 'top'
  const canEditCanvas = session.capabilities.canEditCanvas
  const canEditManifest = session.capabilities.canManageManifest
  const bottomPanelsOpen = !isNarrow

  useEffect(() => {
    if (isNarrow) {
      setMapOpen(false)
      setWorkbenchOpen(false)
      setBuilderOpen(false)
    }
  }, [isNarrow])

  useEffect(() => {
    if (session.offline) return
    const ws = session.clientSession.workspaceId
    const key = `matrix-builder-onboard-${ws}`
    if (localStorage.getItem(key) === 'done') return
    void fetchBuilderSetupContext().then(({ context }) => {
      if (context.dataSourceCount === 0 || context.gaps.length > 0) {
        setBuilderOpen(true)
        session.showFlash('歡迎打造後台：可先規劃資料源，或點起步問題跟 Agent 對話', 'ok')
      }
      localStorage.setItem(key, 'done')
    })
  }, [session.clientSession.workspaceId, session.offline, session.showFlash])

  function handleBlockAction(action: BlockAction) {
    void session.runMcpInvoke(action.mcpTool, action.payload)
  }

  useEffect(() => {
    if (!session.platform.commandPaletteEnabled) return
    return installShortcutListener(session.platform, {
      openCommandPalette: () => setPaletteOpen(true),
      focusComposer: () => composerRef.current?.focus(),
      showShortcuts: () => setShortcutsOpen(true),
      nextBlock: () => session.focusAdjacentBlock(1),
      prevBlock: () => session.focusAdjacentBlock(-1),
      expandBlock: () => {
        const id = session.focusedBlockId ?? session.canvas.blocks[0]?.blockId
        const block = session.canvas.blocks.find((b) => b.blockId === id)
        if (block) setExpandedBlock(block)
      },
      closeOverlay: () => {
        setPaletteOpen(false)
        setShortcutsOpen(false)
        setExpandedBlock(null)
      },
    })
  }, [session.platform, session.focusAdjacentBlock, session.focusedBlockId, session.canvas.blocks])

  return (
    <AppShell
      health={session.health}
      platform={session.platform}
      lastProvider={session.lastProvider}
      offline={session.offline}
      agents={session.agents}
      activeAgentId={session.clientSession.agentId}
      onAgentChange={session.selectAgent}
      workspaces={session.workspaces}
      activeWorkspaceId={session.clientSession.workspaceId}
      onWorkspaceChange={(id) => {
        session.selectWorkspace(id)
        reloadCatalog()
      }}
      devUsers={session.devUsers}
      activeUserId={session.clientSession.userId}
      onUserChange={session.selectUser}
      capabilities={session.capabilities}
      onOpenTeam={() => setTeamOpen(true)}
      flash={session.flash}
      onDismissFlash={session.clearFlash}
      showMobileNavButton={session.platform.moduleSidebarEnabled}
      onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
    >
      {session.platform.modulePillsEnabled ? (
        <ModulePillBar items={catalogItems} onSelect={session.runCatalogItem} />
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {session.platform.moduleSidebarEnabled ? (
          <ModuleSidebar
            items={catalogItems}
            loading={catalogLoading}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
            onSelect={(item) => {
              setMobileNavOpen(false)
              session.runCatalogItem(item)
            }}
          />
        ) : null}
        {session.platform.showHistory ? (
          <ChatHistoryPanel
            messages={session.messages}
            onPickUserMessage={(text) => composerRef.current?.setDraft(text)}
            onRateReply={(logId, rating) => void session.rateAssistantReply(logId, rating)}
          />
        ) : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <main
            className={
              top ? 'min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-44' : 'min-h-0 flex-1 overflow-y-auto px-6 pb-48 pt-2'
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
          </main>
          <BuilderHubPanel
            open={builderOpen}
            onToggle={() => setBuilderOpen((v) => !v)}
            canManageManifest={canEditManifest}
            onAskAgent={(prompt) => void session.sendMessage(prompt)}
            onApplied={() => {
              void session.refreshBackend()
              reloadCatalog()
            }}
            onFlash={session.showFlash}
          />
          <WorkspaceMapPanel open={mapOpen} onToggle={() => setMapOpen((v) => !v)} refreshKey={session.opsRefreshKey} />
          <WorkbenchPanel
            open={workbenchOpen}
            onToggle={() => setWorkbenchOpen((v) => !v)}
            canEdit={canEditManifest}
            onSaved={() => {
              void session.refreshBackend()
              reloadCatalog()
            }}
          />
          {session.platform.showToolTrace ? (
            <>
              <OpsInsightsPanel refreshKey={session.opsRefreshKey} defaultOpen={bottomPanelsOpen} />
              <ToolTracePanel entries={session.traceLog} defaultOpen={bottomPanelsOpen} />
            </>
          ) : null}
          <AgentTopologyPanel runId={session.lastRunId} />
          <Composer
            ref={composerRef}
            messages={session.messages}
            platform={session.platform}
            suggestions={session.suggestions}
            busy={session.busy}
            onSend={(text) => void session.sendMessage(text)}
          />
        </div>
      </div>
      <CommandPalette
        open={paletteOpen && session.platform.commandPaletteEnabled}
        items={catalogItems}
        onClose={() => setPaletteOpen(false)}
        onSelect={session.runCatalogItem}
      />
      <ShortcutsHelpModal open={shortcutsOpen} platform={session.platform} onClose={() => setShortcutsOpen(false)} />
      <WorkspaceTeamPanel
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        workspaceId={session.clientSession.workspaceId}
        canInvite={session.capabilities.canInvite}
        members={session.workspaceMembers}
        onAccepted={() => void session.refreshBackend()}
        onFlash={session.showFlash}
      />
    </AppShell>
  )
}
