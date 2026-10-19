import type { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { BLOCK_TEMPLATES } from '../../shared/blockTemplates.ts'
import { loadCanvas, saveCanvas } from '../canvas/store.ts'
import { validateBlockProps } from '../canvas/validate.ts'
import {
  acceptInvite,
  createInvite,
  createWorkspace,
  listPendingInvites,
  listWorkspacesForUser,
} from '../db/store.ts'
import { sessionFromHeaders } from '../context.ts'
import { logCanvasOp, logManifestEdit } from '../ops/record.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { buildResourceGraph } from './resourceMap.ts'
import {
  diffManifestLines,
  loadManifest,
  loadManifestRevision,
  saveManifest,
} from './manifest.ts'
import { canInvite, canManageManifest, listUsersInWorkspace, requireMinRole, RbacError } from './rbac.ts'
import { listWorkbenchFiles, readWorkbenchFile, writeWorkbenchFile } from './workbench.ts'

function rbacJson(c: { json: (a: unknown, b?: number) => Response }, err: unknown) {
  if (err instanceof RbacError) return c.json({ error: err.message }, 403)
  if (err instanceof Error) return c.json({ error: err.message }, 400)
  return c.json({ error: 'failed' }, 500)
}

export function registerWorkspaceRoutes(app: Hono) {
  app.get('/api/workspaces', (c) => {
    const session = sessionFromHeaders(c)
    const workspaces = listWorkspacesForUser(session.user.id)
    return c.json({ workspaces })
  })

  app.post('/api/workspaces', async (c) => {
    const session = sessionFromHeaders(c)
    const body = await c.req.json<{ name: string; slug: string }>()
    try {
      const result = createWorkspace({
        name: body.name,
        slug: body.slug,
        ownerUserId: session.user.id,
      })
      return c.json(result)
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.get('/api/workspaces/:id/members', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    if (session.workspace.id !== c.req.param('id')) requireMinRole(session, 'admin')
    return c.json({ members: listUsersInWorkspace(c.req.param('id')) })
  })

  app.get('/api/workspaces/:id/invites', (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canInvite(session)) throw new RbacError('無法查看邀請')
      const workspaceId = c.req.param('id')
      if (session.workspace.id !== workspaceId) requireMinRole(session, 'admin')
      return c.json({ invites: listPendingInvites(workspaceId) })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.post('/api/workspaces/:id/invites', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canInvite(session)) throw new RbacError('無法邀請成員')
      const body = await c.req.json<{ email: string; role?: 'admin' | 'member' | 'viewer' }>()
      const invite = createInvite({
        workspaceId: c.req.param('id'),
        email: body.email,
        role: body.role ?? 'member',
      })
      return c.json({ invite, acceptPath: `/api/invites/accept`, token: invite.token })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.post('/api/invites/accept', async (c) => {
    const session = sessionFromHeaders(c)
    const body = await c.req.json<{ token: string }>()
    try {
      const invite = acceptInvite(body.token, session.user.id)
      return c.json({ ok: true, workspaceId: invite.workspaceId })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.get('/api/manifest', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const manifest = loadManifest(session.workspace.id, session.workspace.name)
    return c.json({ manifest })
  })

  app.put('/api/manifest', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canManageManifest(session)) throw new RbacError('無法修改 manifest')
      const body = await c.req.json<{ manifest: WorkspaceManifest }>()
      const prev = loadManifest(session.workspace.id, session.workspace.name)
      saveManifest(session.workspace.id, body.manifest)
      logManifestEdit(session, body.manifest.revision)
      const diff = diffManifestLines(JSON.stringify(prev, null, 2), JSON.stringify(body.manifest, null, 2))
      return c.json({ ok: true, revision: body.manifest.revision, diff })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.get('/api/manifest/diff', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const rev = Number(c.req.query('revision') ?? '0')
    const current = loadManifest(session.workspace.id, session.workspace.name)
    const prev = rev ? loadManifestRevision(session.workspace.id, rev) : null
    if (!prev) return c.json({ diff: [] })
    return c.json({
      diff: diffManifestLines(JSON.stringify(prev, null, 2), JSON.stringify(current, null, 2)),
    })
  })

  app.get('/api/resource-map', async (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const graph = await buildResourceGraph(session.workspace.id, session.workspace.name)
    return c.json({ graph })
  })

  app.get('/api/workbench/files', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    return c.json({ files: listWorkbenchFiles(session.workspace.id) })
  })

  app.get('/api/workbench/file', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'member')
    const key = c.req.query('key') ?? 'manifest.json'
    try {
      const content = readWorkbenchFile(session.workspace.id, key)
      return c.json({ key, content })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.put('/api/workbench/file', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      if (!canManageManifest(session)) throw new RbacError('無法寫入工作台')
      const body = await c.req.json<{ key: string; content: string }>()
      writeWorkbenchFile(session.workspace.id, body.key, body.content)
      if (body.key === 'manifest.json') {
        const manifest = JSON.parse(body.content) as WorkspaceManifest
        saveManifest(session.workspace.id, manifest)
        logManifestEdit(session, manifest.revision)
      }
      return c.json({ ok: true })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.get('/api/blocks/templates', (c) => c.json({ templates: BLOCK_TEMPLATES }))

  app.get('/api/canvas', (c) => {
    const session = sessionFromHeaders(c)
    requireMinRole(session, 'viewer')
    const canvas = loadCanvas(session.workspace.id)
    const manifest = loadManifest(session.workspace.id, session.workspace.name)
    return c.json({ canvas, mergeMode: manifest.canvasMergeMode })
  })

  app.put('/api/canvas', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      requireMinRole(session, 'member')
      const body = await c.req.json<{ canvas: typeof loadCanvas extends (...args: never[]) => infer R ? R : never; revision?: number }>()
      const saved = saveCanvas(session.workspace.id, body.canvas, body.revision)
      logCanvasOp(session, 'canvas.edit', {})
      return c.json({ canvas: saved })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.post('/api/canvas/blocks', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      requireMinRole(session, 'member')
      const body = await c.req.json<{ templateId: string; props?: Record<string, unknown> }>()
      const tpl = BLOCK_TEMPLATES.find((t) => t.id === body.templateId)
      if (!tpl) throw new Error('未知模板')
      const props = validateBlockProps(
        tpl.component,
        { ...tpl.defaultProps, ...body.props },
        session.workspace.id,
        session.workspace.name,
      ).props
      const canvas = loadCanvas(session.workspace.id)
      const block = {
        type: 'block' as const,
        component: tpl.component,
        blockId: `user-${randomUUID().slice(0, 8)}`,
        props,
      }
      canvas.blocks.push(block)
      const saved = saveCanvas(session.workspace.id, canvas)
      logCanvasOp(session, 'canvas.add', { blockId: block.blockId, templateId: body.templateId })
      return c.json({ canvas: saved, blockId: block.blockId })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.patch('/api/canvas/blocks/:blockId', async (c) => {
    const session = sessionFromHeaders(c)
    try {
      requireMinRole(session, 'member')
      const body = await c.req.json<{ props: Record<string, unknown> }>()
      const canvas = loadCanvas(session.workspace.id)
      const idx = canvas.blocks.findIndex((b) => b.blockId === c.req.param('blockId'))
      if (idx < 0) throw new Error('block 不存在')
      const block = canvas.blocks[idx]!
      const props = validateBlockProps(
        block.component,
        { ...block.props, ...body.props },
        session.workspace.id,
        session.workspace.name,
      ).props
      canvas.blocks[idx] = { ...block, props }
      const saved = saveCanvas(session.workspace.id, canvas)
      logCanvasOp(session, 'canvas.edit', { blockId: block.blockId })
      return c.json({ canvas: saved })
    } catch (err) {
      return rbacJson(c, err)
    }
  })

  app.delete('/api/canvas/blocks/:blockId', (c) => {
    const session = sessionFromHeaders(c)
    try {
      requireMinRole(session, 'member')
      const canvas = loadCanvas(session.workspace.id)
      canvas.blocks = canvas.blocks.filter((b) => b.blockId !== c.req.param('blockId'))
      const saved = saveCanvas(session.workspace.id, canvas)
      logCanvasOp(session, 'canvas.delete', { blockId: c.req.param('blockId') })
      return c.json({ canvas: saved })
    } catch (err) {
      return rbacJson(c, err)
    }
  })
}
