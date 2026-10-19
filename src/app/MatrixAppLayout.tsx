import { useEffect, useRef, useState } from 'react'
import { matchPath, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { ChatHistoryPanel } from '../features/chat/ChatHistoryPanel'
import { CommandPalette } from '../features/command/CommandPalette'
import { installShortcutListener } from '../features/keyboard/shortcutRegistry'
import { ShortcutsHelpModal } from '../features/keyboard/ShortcutsHelpModal'
import { ModuleSidebar } from '../features/module/ModuleSidebar'
import { useModuleCatalog } from '../features/module/useModuleCatalog'
import { useWorkspaceModules } from '../features/module/useWorkspaceModules'
import { AgentSessionProvider, useAgentSessionContext } from '../features/session/AgentSessionContext'
import { WorkspaceTeamPanel } from '../features/workspace/WorkspaceTeamPanel'
import { HomePage } from '../pages/HomePage'
import { ModulePage } from '../pages/ModulePage'
import { StudioPage } from '../pages/StudioPage'
import type { ComposerHandle } from '../features/chat/Composer'

function MatrixAppInner() {
  const session = useAgentSessionContext()
  const location = useLocation()
  const navigate = useNavigate()
  const moduleMatch = matchPath('/m/:moduleId', location.pathname)
  const activeModuleId = moduleMatch?.params.moduleId
  const isStudio = location.pathname.startsWith('/studio')
  const { modules, loading: modulesLoading, reload: reloadModules } = useWorkspaceModules(
    session.clientSession.workspaceId,
  )
  const { items: catalogItems, reload: reloadCatalog } = useModuleCatalog(
    session.clientSession.workspaceId,
    activeModuleId,
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const composerRef = useRef<ComposerHandle>(null)

  useEffect(() => {
    if (!session.platform.commandPaletteEnabled) return
    return installShortcutListener(session.platform, {
      openCommandPalette: () => setPaletteOpen(true),
      focusComposer: () => composerRef.current?.focus(),
      showShortcuts: () => setShortcutsOpen(true),
      nextBlock: () => session.focusAdjacentBlock(1),
      prevBlock: () => session.focusAdjacentBlock(-1),
      expandBlock: () => {},
      closeOverlay: () => {
        setPaletteOpen(false)
        setShortcutsOpen(false)
      },
    })
  }, [session.platform, session.focusAdjacentBlock])

  const showModuleChrome = !isStudio && session.platform.moduleSidebarEnabled

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
        reloadModules()
        navigate('/')
      }}
      devUsers={session.devUsers}
      activeUserId={session.clientSession.userId}
      onUserChange={session.selectUser}
      capabilities={session.capabilities}
      onOpenTeam={() => setTeamOpen(true)}
      flash={session.flash}
      onDismissFlash={session.clearFlash}
      showMobileNavButton={showModuleChrome}
      onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
      navHomeActive={location.pathname === '/'}
      navStudioActive={isStudio}
      onNavHome={() => navigate('/')}
      onNavStudio={() => navigate('/studio')}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showModuleChrome ? (
          <ModuleSidebar
            modules={modules}
            modulesLoading={modulesLoading}
            activeModuleId={activeModuleId}
            onSelectModule={(id) => {
              setMobileNavOpen(false)
              session.setActiveModule(id)
              navigate(`/m/${id}`)
            }}
            toolItems={activeModuleId ? catalogItems : []}
            onSelectTool={(item) => void session.runMcpInvoke(item.tool, item.defaultPayload)}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />
        ) : null}
        {session.platform.showHistory && !isStudio ? (
          <ChatHistoryPanel
            messages={session.messages}
            onPickUserMessage={(text) => composerRef.current?.setDraft(text)}
            onRateReply={(logId, rating) => void session.rateAssistantReply(logId, rating)}
          />
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/m/:moduleId" element={<ModulePage />} />
            <Route path="/studio" element={<StudioPage />} />
          </Routes>
        </div>
      </div>
      <CommandPalette
        open={paletteOpen && session.platform.commandPaletteEnabled}
        items={catalogItems}
        onClose={() => setPaletteOpen(false)}
        onSelect={(item) => {
          void session.runMcpInvoke(item.tool, item.defaultPayload)
        }}
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

export function MatrixAppLayout() {
  const location = useLocation()
  const moduleMatch = matchPath('/m/:moduleId', location.pathname)
  const canvasModuleId = moduleMatch?.params.moduleId ?? null

  return (
    <AgentSessionProvider
      options={{
        canvasModuleId,
        loadCanvas: Boolean(moduleMatch),
      }}
    >
      <MatrixAppInner />
    </AgentSessionProvider>
  )
}
