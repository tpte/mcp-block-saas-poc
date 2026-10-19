import { useEffect, useRef, useState } from 'react'
import { matchPath, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { CommandPalette } from '../features/command/CommandPalette'
import { installShortcutListener } from '../features/keyboard/shortcutRegistry'
import { ShortcutsHelpModal } from '../features/keyboard/ShortcutsHelpModal'
import { useModuleCatalog } from '../features/module/useModuleCatalog'
import { AgentSessionProvider, useAgentSessionContext } from '../features/session/AgentSessionContext'
import { WorkspaceDock } from '../features/workspace/WorkspaceDock'
import { MePage } from '../pages/MePage'
import { SpacePage } from '../pages/SpacePage'
import { StudioPage } from '../pages/StudioPage'
import {
  HomeOrLastSpace,
  RedirectGlobalStudio,
  RedirectModuleRoute,
} from './RedirectLegacyRoutes'
import { WorkspaceSlugSync } from './WorkspaceSlugSync'
import type { ComposerHandle } from '../features/chat/Composer'

function MatrixAppInner() {
  const session = useAgentSessionContext()
  const location = useLocation()
  const navigate = useNavigate()
  const spaceMatch = matchPath('/w/:slug/*', location.pathname) ?? matchPath('/w/:slug', location.pathname)
  const slug = spaceMatch?.params.slug
  const isStudio = Boolean(location.pathname.includes('/studio'))
  const isMe = location.pathname === '/me'
  const activeWs = session.workspaces.find((w) => w.id === session.clientSession.workspaceId)
  const { items: catalogItems, reload: reloadCatalog } = useModuleCatalog(session.clientSession.workspaceId)
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

  const headerTitle = slug && activeWs ? activeWs.name : session.platform.title

  return (
    <AppShell
      health={session.health}
      platform={{ ...session.platform, title: headerTitle }}
      offline={session.offline}
      flash={session.flash}
      onDismissFlash={session.clearFlash}
      navMeActive={isMe}
      onNavHome={() => navigate('/')}
      onNavMe={() => navigate('/me')}
      showSpaceContext={Boolean(slug) && !isStudio}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<HomeOrLastSpace />} />
            <Route
              path="/w/:slug"
              element={
                <>
                  <WorkspaceSlugSync />
                  <SpacePage />
                </>
              }
            />
            <Route
              path="/w/:slug/studio"
              element={
                <>
                  <WorkspaceSlugSync />
                  <StudioPage />
                </>
              }
            />
            <Route path="/me" element={<MePage />} />
            <Route path="/m/:moduleId" element={<RedirectModuleRoute />} />
            <Route path="/studio" element={<RedirectGlobalStudio />} />
          </Routes>
        </div>
        <WorkspaceDock
          workspaces={session.workspaces}
          activeWorkspaceId={session.clientSession.workspaceId}
          onSelect={(ws) => {
            session.switchWorkspace(ws.id, ws.slug)
            reloadCatalog()
            if (isStudio) navigate(`/w/${ws.slug}/studio`)
            else navigate(`/w/${ws.slug}`)
          }}
        />
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
    </AppShell>
  )
}

export function MatrixAppLayout() {
  const location = useLocation()
  const spaceMatch = matchPath('/w/:slug/*', location.pathname) ?? matchPath('/w/:slug', location.pathname)
  const isStudio = location.pathname.includes('/studio')
  const loadCanvas = Boolean(spaceMatch && !isStudio)

  return (
    <AgentSessionProvider options={{ loadCanvas }}>
      <MatrixAppInner />
    </AgentSessionProvider>
  )
}
