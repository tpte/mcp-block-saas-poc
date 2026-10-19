import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMediaQuery } from '../lib/useMediaQuery'
import { BuilderHubPanel } from '../features/builder/BuilderHubPanel'
import { fetchBuilderSetupContext } from '../mcp/client'
import { AgentTopologyPanel } from '../features/debug/AgentTopologyPanel'
import { OpsInsightsPanel } from '../features/debug/OpsInsightsPanel'
import { ToolTracePanel } from '../features/debug/ToolTracePanel'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { WorkbenchPanel } from '../features/workspace/WorkbenchPanel'
import { WorkspaceMapPanel } from '../features/workspace/WorkspaceMapPanel'
import { WorkspaceToolsDock, type WorkspaceToolTab } from '../features/workspace/WorkspaceToolsDock'
import { useModuleCatalog } from '../features/module/useModuleCatalog'

export function StudioPage() {
  const session = useAgentSessionContext()
  const isNarrow = useMediaQuery('(max-width: 767px)')
  const [builderOpen, setBuilderOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [mobileToolTab, setMobileToolTab] = useState<WorkspaceToolTab>('builder')
  const { reload: reloadCatalog } = useModuleCatalog(session.clientSession.workspaceId)
  const canEditManifest = session.capabilities.canManageManifest

  useEffect(() => {
    const ws = session.clientSession.workspaceId
    const key = `matrix-builder-onboard-${ws}`
    if (localStorage.getItem(key) === 'done') return
    void fetchBuilderSetupContext().then(({ context }) => {
      if (context.dataSourceCount === 0 || context.gaps.length > 0) {
        session.showFlash('Studio：可先規劃資料源與 MODULE（MCP）', 'ok')
      }
      localStorage.setItem(key, 'done')
    })
  }, [session.clientSession.workspaceId, session.showFlash])

  const builderPanel = (
    <BuilderHubPanel
      open={isNarrow ? mobileToolTab === 'builder' : builderOpen}
      embedded={isNarrow}
      onToggle={() => (isNarrow ? setMobileToolTab(null) : setBuilderOpen((v) => !v))}
      canManageManifest={canEditManifest}
      onAskAgent={(prompt) => void session.sendMessage(prompt)}
      onApplied={() => {
        void session.refreshBackend()
        reloadCatalog()
      }}
      onFlash={session.showFlash}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-4 py-2">
        <div>
          <p className="text-sm font-semibold">Studio</p>
          <p className="text-xs text-[var(--muted)]">MODULE（MCP）· BLOCK · manifest · 資料源</p>
        </div>
        <Link to="/" className="text-xs text-cyan-700 hover:underline dark:text-cyan-400">
          ← 回 MATRIX 主頁
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isNarrow ? (
          <WorkspaceToolsDock
            compact
            activeTab={mobileToolTab}
            onTabChange={setMobileToolTab}
            builder={builderPanel}
            map={
              <WorkspaceMapPanel
                open={mobileToolTab === 'map'}
                embedded
                onToggle={() => setMobileToolTab(null)}
                refreshKey={session.opsRefreshKey}
              />
            }
            workbench={
              <WorkbenchPanel
                open={mobileToolTab === 'workbench'}
                embedded
                onToggle={() => setMobileToolTab(null)}
                canEdit={canEditManifest}
                onSaved={() => {
                  void session.refreshBackend()
                  reloadCatalog()
                }}
              />
            }
            debug={
              <>
                {session.platform.showToolTrace ? (
                  <>
                    <OpsInsightsPanel refreshKey={session.opsRefreshKey} defaultOpen={false} />
                    <ToolTracePanel entries={session.traceLog} defaultOpen={false} />
                  </>
                ) : null}
                <AgentTopologyPanel runId={session.lastRunId} />
              </>
            }
          />
        ) : (
          <>
            {builderPanel}
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
                <OpsInsightsPanel refreshKey={session.opsRefreshKey} defaultOpen={false} />
                <ToolTracePanel entries={session.traceLog} defaultOpen={false} />
              </>
            ) : null}
            <AgentTopologyPanel runId={session.lastRunId} />
          </>
        )}
      </div>
    </div>
  )
}
