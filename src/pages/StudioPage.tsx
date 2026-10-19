import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
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
import { StudioSectionTabs, type StudioSection } from '../features/workspace/StudioSectionTabs'
import { useModuleCatalog } from '../features/module/useModuleCatalog'

function parseStudioFocus(raw: string | null): StudioSection | null {
  if (raw === 'builder' || raw === 'map' || raw === 'workbench') return raw
  return null
}

export function StudioPage() {
  const { slug = 'personal' } = useParams()
  const [searchParams] = useSearchParams()
  const session = useAgentSessionContext()
  const isNarrow = useMediaQuery('(max-width: 767px)')
  const [section, setSection] = useState<StudioSection>('builder')
  const [mobileToolTab, setMobileToolTab] = useState<WorkspaceToolTab>('builder')
  const [debugOpen, setDebugOpen] = useState(false)
  const { reload: reloadCatalog } = useModuleCatalog(session.clientSession.workspaceId)
  const canEditManifest = session.capabilities.canManageManifest

  useEffect(() => {
    const focus = parseStudioFocus(searchParams.get('focus'))
    if (!focus) return
    setSection(focus)
    setMobileToolTab(focus)
  }, [searchParams])

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
      open={isNarrow ? mobileToolTab === 'builder' : section === 'builder'}
      embedded={isNarrow}
      onToggle={() => (isNarrow ? setMobileToolTab(null) : setSection('builder'))}
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
      {!canEditManifest ? (
        <div className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          目前是 {session.capabilities.role}，只能查看與請 Agent 說明；改模組與資料源需 admin。
        </div>
      ) : null}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-4 py-2">
        <div>
          <p className="text-sm font-semibold">Studio</p>
          <p className="text-xs text-[var(--muted)]">打造後台、地圖、manifest 工作台</p>
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
            ← 回到 SPACE
          </Link>
        </div>
      </div>
      {!isNarrow ? <StudioSectionTabs active={section} onChange={setSection} /> : null}
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
            {section === 'builder' ? builderPanel : null}
            {section === 'map' ? (
              <WorkspaceMapPanel open embedded onToggle={() => setSection('map')} refreshKey={session.opsRefreshKey} />
            ) : null}
            {section === 'workbench' ? (
              <WorkbenchPanel
                open
                embedded
                onToggle={() => setSection('workbench')}
                canEdit={canEditManifest}
                onSaved={() => {
                  void session.refreshBackend()
                  reloadCatalog()
                }}
              />
            ) : null}
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
