import type { Hono } from 'hono'
import { sessionFromHeaders } from '../context.ts'
import { requireMinRole } from '../workspaces/rbac.ts'
import { loadManifest } from '../workspaces/manifest.ts'
import { listBuilderSkills, readBuilderSkill, searchBuilderKnowledge } from './registry.ts'
import { analyzeSetupContext } from './setupContext.ts'
import { listWorkspaceTemplateMeta } from '../../shared/workspaceTemplates.ts'

export function registerBuilderRoutes(app: Hono) {
  app.get('/api/builder/skills', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    return c.json({ skills: listBuilderSkills() })
  })

  app.get('/api/builder/templates', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    return c.json({ templates: listWorkspaceTemplateMeta() })
  })

  app.get('/api/builder/setup-context', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const manifest = loadManifest(session.workspace.id, session.workspace.name)
    return c.json({ context: analyzeSetupContext(manifest) })
  })

  app.get('/api/builder/skills/:id', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const id = c.req.param('id')
    return c.json({ skillId: id, body: readBuilderSkill(id) })
  })

  app.post('/api/builder/rag/search', async (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const body = await c.req.json<{ query: string; limit?: number }>()
    const hits = searchBuilderKnowledge(body.query ?? '', body.limit ?? 5)
    return c.json({ hits })
  })
}
