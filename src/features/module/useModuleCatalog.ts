import { useCallback, useEffect, useState } from 'react'
import { fetchMcpCatalog, type CatalogItem } from '../../mcp/client'
import { loadClientSession } from '../../session/apiHeaders.ts'

export function useModuleCatalog(workspaceId?: string, moduleId?: string) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const ws = workspaceId ?? loadClientSession().workspaceId

  const reload = useCallback(() => {
    setLoading(true)
    void fetchMcpCatalog(moduleId)
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [ws, moduleId])

  useEffect(() => {
    reload()
  }, [reload])

  return { items, loading, reload }
}
