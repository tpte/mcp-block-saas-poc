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
  // 開發者工作台預設進「工作台」（manifest／Diff）；資料源計畫只在「打造後台」精靈裡。
  const defaultSection: StudioSection = slug === 'personal' ? 'workbench' : 'builder'
  const [section, setSection] = useState<StudioSection>(defaultSection)
  const [mobileToolTab, setMobileToolTab] = useState<WorkspaceToolTab>(defaultSection)
  const [debugOpen, setDebugOpen] = useState(false)
  const { reload: reloadCatalog } = useModuleCatalog(session.clientSession.workspaceId)
  const canEditManifest = session.capabilities.canManageManifest
  const canWriteManifest = session.capabilities.canWriteManifest ?? canEditManifest

  useEffect(() => {
    const focus = parseStudioFocus(searchParams.get('focus'))
    if (!focus) return
    setSection(focus)
    setMobileToolTab(focus)
  }, [searchParams])

  useEffect(() => {
    const ws = session.clientSession.workspaceId
    const key = `matrix-builder-onboard-${ws}`
    if (slug === 'personal' || localStorage.getItem(key) === 'done') return
    void fetchBuilderSetupContext().then(({ context }) => {
      if (context.dataSourceCount === 0 || context.gaps.length > 0) {
        session.showFlash('可以先接上資料，再讓 Agent 畫出畫面', 'ok')
      }
      localStorage.setItem(key, 'done')
    })
  }, [slug, session.clientSession.workspaceId, session.showFlash])

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
          <p className="text-sm font-semibold">工作區設定</p>
          <p className="text-xs text-[var(--muted)]">工作台：manifest／Diff／Git（開發者）· 打造後台：引導式精靈 · 地圖</p>
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
                canEdit={canWriteManifest}
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
                canEdit={canWriteManifest}
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
