import { useCallback, useEffect, useState } from 'react'
import type { WorkspaceModule } from '../../../shared/modulePage.ts'
import { fetchWorkspaceModules } from '../../mcp/client'

export function useWorkspaceModules(workspaceId?: string) {
  const [modules, setModules] = useState<WorkspaceModule[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    void fetchWorkspaceModules()
      .then((d) => setModules(d.modules))
      .catch(() => setModules([]))
      .finally(() => setLoading(false))
  }, [workspaceId])

  useEffect(() => {
    reload()
  }, [reload])

  return { modules, loading, reload }
}
