import type { CanvasPage } from '../../shared/ui.ts'
import { storageGet, storagePut } from '../storage/workspaceStorage.ts'

const CANVAS_KEY = 'canvas.json'

export type StoredCanvas = CanvasPage & { revision: number }

export function loadCanvas(workspaceId: string): StoredCanvas {
  const raw = storageGet(workspaceId, CANVAS_KEY)
  if (!raw) return { layout: 'stack', blocks: [], revision: 1 }
  return JSON.parse(raw.toString()) as StoredCanvas
}

export function saveCanvas(workspaceId: string, canvas: StoredCanvas, expectedRevision?: number) {
  if (expectedRevision !== undefined && canvas.revision !== expectedRevision) {
    throw new Error('revision 衝突')
  }
  const next = { ...canvas, revision: (canvas.revision ?? 1) + 1 }
  storagePut(workspaceId, CANVAS_KEY, JSON.stringify(next, null, 2))
  return next
}
