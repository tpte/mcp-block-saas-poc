import type { CanvasPage } from '../../shared/ui.ts'
import { LEGACY_MODULE_ID, MODULE_CANVAS_DIR } from '../../shared/modulePage.ts'
import { storageGet, storagePut } from '../storage/workspaceStorage.ts'

const LEGACY_CANVAS_KEY = 'canvas.json'

export type StoredCanvas = CanvasPage & { revision: number }

function moduleCanvasKey(moduleId: string) {
  return `${MODULE_CANVAS_DIR}/${moduleId}/canvas.json`
}

export function migrateLegacyCanvas(workspaceId: string) {
  const legacyRaw = storageGet(workspaceId, LEGACY_CANVAS_KEY)
  if (!legacyRaw) return
  const targetKey = moduleCanvasKey(LEGACY_MODULE_ID)
  if (storageGet(workspaceId, targetKey)) return
  storagePut(workspaceId, targetKey, legacyRaw.toString())
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

/** @deprecated use loadModuleCanvas */
export function loadCanvas(workspaceId: string): StoredCanvas {
  return loadModuleCanvas(workspaceId, LEGACY_MODULE_ID)
}

/** @deprecated use saveModuleCanvas */
export function saveCanvas(workspaceId: string, canvas: StoredCanvas, expectedRevision?: number) {
  return saveModuleCanvas(workspaceId, LEGACY_MODULE_ID, canvas, expectedRevision)
}

export function resolveModuleIdFromRequest(moduleIdParam?: string | null, headerModuleId?: string | null) {
  const id = (moduleIdParam ?? headerModuleId ?? LEGACY_MODULE_ID).trim()
  return id || LEGACY_MODULE_ID
}
