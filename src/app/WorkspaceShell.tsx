import { useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { SpacePage } from '../pages/SpacePage'
import { StudioPage } from '../pages/StudioPage'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'
import { MatrixNavigateListener } from './MatrixNavigateListener'
import { WorkspaceSlugSync } from './WorkspaceSlugSync'

/** 同一工作區只掛一個殼；SPACE ↔ Studio 交叉淡入，避免整頁卸載閃爍。 */
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
          'relative flex min-h-0 flex-1 flex-col overflow-hidden transition-opacity duration-200 ease-out',
          switching ? 'opacity-80' : 'opacity-100',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 flex min-h-0 flex-col transition-opacity duration-200 ease-out',
            isStudio ? 'pointer-events-none z-0 opacity-0' : 'z-10 opacity-100',
          )}
          aria-hidden={isStudio}
        >
          <SpacePage />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex min-h-0 flex-col transition-opacity duration-200 ease-out',
            isStudio ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0',
          )}
          aria-hidden={!isStudio}
        >
          <StudioPage />
        </div>
      </div>
    </>
  )
}
