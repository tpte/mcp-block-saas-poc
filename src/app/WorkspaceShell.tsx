import { useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { SpacePage } from '../pages/SpacePage'
import { StudioPage } from '../pages/StudioPage'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { MatrixNavigateListener } from './MatrixNavigateListener'
import { WorkspaceSlugSync } from './WorkspaceSlugSync'

/** 同一工作區只掛一個殼；SPACE 與 Studio 只渲染其一，避免透明層疊加造成版面錯亂。 */
export function WorkspaceShell() {
  const { pathname } = useLocation()
  const isStudio = pathname.includes('/studio')
  const session = useAgentSessionContext()
  const switching = session.workspaceSwitching

  return (
    <>
      <WorkspaceSlugSync />
      <MatrixNavigateListener />
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden transition-opacity duration-150 ease-out',
          switching ? 'opacity-90' : 'opacity-100',
        )}
      >
        {isStudio ? <StudioPage /> : <SpacePage />}
      </div>
    </>
  )
}
