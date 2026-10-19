import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAgentSessionContext } from '../features/session/AgentSessionContext'

/** Keeps X-Workspace-Id headers aligned with /w/:slug route. */
export function WorkspaceSlugSync() {
  const { slug = '' } = useParams()
  const session = useAgentSessionContext()

  useEffect(() => {
    const ws = session.workspaces.find((w) => w.slug === slug)
    if (!ws) return
    if (ws.id === session.clientSession.workspaceId) return
    session.switchWorkspace(ws.id, ws.slug)
  }, [slug, session.workspaces, session.clientSession.workspaceId, session.switchWorkspace])

  return null
}
