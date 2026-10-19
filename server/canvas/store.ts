import type { CanvasPage } from '../../shared/ui.ts'
import { LEGACY_MODULE_ID, MODULE_CANVAS_DIR } from '../../shared/modulePage.ts'

export { LEGACY_MODULE_ID }
import { storageGet, storagePut } from '../storage/workspaceStorage.ts'

const LEGACY_CANVAS_KEY = 'canvas.json'

export type StoredCanvas = CanvasPage & { revision: number }

function moduleCanvasKey(moduleId: string) {
  return `${MODULE_CANVAS_DIR}/${moduleId}/canvas.json`
}

export function migrateLegacyCanvas(workspaceId: string) {
  const rootRaw = storageGet(workspaceId, LEGACY_CANVAS_KEY)
  const moduleLegacyRaw = storageGet(workspaceId, moduleCanvasKey(LEGACY_MODULE_ID))
  if (!rootRaw && moduleLegacyRaw) {
    storagePut(workspaceId, LEGACY_CANVAS_KEY, moduleLegacyRaw.toString())
    return
  }
  if (rootRaw && !moduleLegacyRaw) {
    storagePut(workspaceId, moduleCanvasKey(LEGACY_MODULE_ID), rootRaw.toString())
  }
}

export function loadWorkspaceCanvas(workspaceId: string): StoredCanvas {
  migrateLegacyCanvas(workspaceId)
  const raw = storageGet(workspaceId, LEGACY_CANVAS_KEY)
  if (raw) return JSON.parse(raw.toString()) as StoredCanvas
  return loadModuleCanvas(workspaceId, LEGACY_MODULE_ID)
}

export function saveWorkspaceCanvas(
  workspaceId: string,
  canvas: StoredCanvas,
  expectedRevision?: number,
) {
  if (expectedRevision !== undefined && canvas.revision !== expectedRevision) {
    throw new Error('revision 衝突')
  }
  const next = { ...canvas, revision: (canvas.revision ?? 1) + 1 }
  storagePut(workspaceId, LEGACY_CANVAS_KEY, JSON.stringify(next, null, 2))
  return next
}

export function loadModuleCanvas(workspaceId: string, moduleId: string): StoredCanvas {
  migrateLegacyCanvas(workspaceId)
  const raw = storageGet(workspaceId, moduleCanvasKey(moduleId))
  if (!raw) return { layout: 'stack', blocks: [], revision: 1 }
  return JSON.parse(raw.toString()) as StoredCanvas
}

export function saveModuleCanvas(
  workspaceId: string,
  moduleId: string,
  canvas: StoredCanvas,
  expectedRevision?: number,
) {
  if (expectedRevision !== undefined && canvas.revision !== expectedRevision) {
    throw new Error('revision 衝突')
  }
  const next = { ...canvas, revision: (canvas.revision ?? 1) + 1 }
  storagePut(workspaceId, moduleCanvasKey(moduleId), JSON.stringify(next, null, 2))
  return next
}

/** Workspace runtime canvas (canvas.json) */
export function loadCanvas(workspaceId: string): StoredCanvas {
  return loadWorkspaceCanvas(workspaceId)
}

export function saveCanvas(workspaceId: string, canvas: StoredCanvas, expectedRevision?: number) {
  return saveWorkspaceCanvas(workspaceId, canvas, expectedRevision)
}

export function resolveModuleIdFromRequest(moduleIdParam?: string | null, headerModuleId?: string | null) {
  const id = (moduleIdParam ?? headerModuleId ?? 'workspace').trim()
  return id || 'workspace'
}

const WORKSPACE_CANVAS_SCOPE = 'workspace'

export function isWorkspaceCanvasScope(scope: string) {
  return scope === WORKSPACE_CANVAS_SCOPE || scope === LEGACY_MODULE_ID || !scope
}

export function resolveCanvasScope(moduleIdParam?: string | null, headerModuleId?: string | null) {
  const id = resolveModuleIdFromRequest(moduleIdParam, headerModuleId)
  if (id === 'workspace' || id === LEGACY_MODULE_ID) return WORKSPACE_CANVAS_SCOPE
  return id
}
