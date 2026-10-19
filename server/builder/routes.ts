import type { Hono } from 'hono'
import { sessionFromHeaders } from '../context.ts'
import { requireMinRole } from '../workspaces/rbac.ts'
import { loadManifest } from '../workspaces/manifest.ts'
import { listBuilderSkills, readBuilderSkill, searchBuilderKnowledge } from './registry.ts'
import { analyzeSetupContext } from './setupContext.ts'
import { listWorkspaceTemplateMeta } from '../../shared/workspaceTemplates.ts'
import { canManageManifest } from '../workspaces/rbac.ts'
import { RbacError } from '../workspaces/rbac.ts'
import {
  appendManifestDataSource,
  setEnabledModules,
  validateDataSourceInput,
} from './manifestOps.ts'

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

  app.post('/api/builder/data-sources', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canManageManifest(session)) throw new RbacError('需要 admin 才能新增資料源')
      const body = await c.req.json<{ label: string; type: string; id?: string; secretRef?: string }>()
      const record = validateDataSourceInput(body)
      const manifest = appendManifestDataSource(session, record)
      return c.json({ ok: true, dataSource: record, dataSources: manifest.dataSources })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed'
      const status = err instanceof RbacError ? 403 : 400
      return c.json({ error: message }, status)
    }
  })

  app.put('/api/builder/modules', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canManageManifest(session)) throw new RbacError('需要 admin 才能調整模組')
      const body = await c.req.json<{ enabledCatalogIds: string[] }>()
      const manifest = setEnabledModules(session, body.enabledCatalogIds ?? [])
      return c.json({ ok: true, enabledCatalogIds: manifest.modules.enabledCatalogIds })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed'
      const status = err instanceof RbacError ? 403 : 400
      return c.json({ error: message }, status)
    }
  })
}
