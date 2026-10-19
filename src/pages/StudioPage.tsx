import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  const { slug = 'personal' } = useParams()
  const session = useAgentSessionContext()
  const isNarrow = useMediaQuery('(max-width: 767px)')
  const [builderOpen, setBuilderOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [mobileToolTab, setMobileToolTab] = useState<WorkspaceToolTab>('builder')
  const [debugOpen, setDebugOpen] = useState(false)
  const { reload: reloadCatalog } = useModuleCatalog(session.clientSession.workspaceId)
  const canEditManifest = session.capabilities.canManageManifest

  useEffect(() => {
    const ws = session.clientSession.workspaceId
    const key = `matrix-builder-onboard-${ws}`
    if (localStorage.getItem(key) === 'done') return
    void fetchBuilderSetupContext().then(({ context }) => {
      if (context.dataSourceCount === 0 || context.gaps.length > 0) {
        session.showFlash('可以先接上資料，再讓 Agent 畫出畫面', 'ok')
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
          <p className="text-xs text-[var(--muted)]">調整這個工作區的資料與版面</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs text-[var(--muted)] hover:text-[var(--fg)]"
            onClick={() => setDebugOpen((v) => !v)}
          >
            {debugOpen ? '隱藏除錯' : '除錯'}
          </button>
          <Link to={`/w/${slug}`} className="text-xs text-cyan-700 hover:underline dark:text-cyan-400">
            ← 回到工作區
          </Link>
        </div>
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
              debugOpen ? (
                <>
                  <OpsInsightsPanel refreshKey={session.opsRefreshKey} defaultOpen={false} />
                  <ToolTracePanel entries={session.traceLog} defaultOpen={false} />
                  <AgentTopologyPanel runId={session.lastRunId} />
                </>
              ) : null
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
            {debugOpen ? (
              <>
                <OpsInsightsPanel refreshKey={session.opsRefreshKey} defaultOpen={false} />
                <ToolTracePanel entries={session.traceLog} defaultOpen={false} />
                <AgentTopologyPanel runId={session.lastRunId} />
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
