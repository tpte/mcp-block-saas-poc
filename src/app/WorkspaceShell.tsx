import { useLocation } from 'react-router-dom'
import { SpacePage } from '../pages/SpacePage'
import { StudioPage } from '../pages/StudioPage'
import { WorkspaceSlugSync } from './WorkspaceSlugSync'

/** 同一工作區只掛一個殼，避免 Studio ↔ SPACE 切換時舊版面殘留。 */
export function WorkspaceShell() {
  const { pathname } = useLocation()
  const isStudio = pathname.includes('/studio')
  return (
    <>
      <WorkspaceSlugSync />
      {isStudio ? <StudioPage /> : <SpacePage />}
    </>
  )
}
