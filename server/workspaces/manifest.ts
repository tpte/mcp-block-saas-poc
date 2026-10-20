import { MCP_TOOL_NAMES } from '../mcp/handlers.ts'
import { defaultPlatform, getWorkspacePlatform, setWorkspacePlatform } from '../db/store.ts'
import { storageGet, storagePut } from '../storage/workspaceStorage.ts'
import { DEFAULT_COMPANY_COCKPIT } from '../../shared/cockpit.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { MANIFEST_FILENAME, MANIFEST_HISTORY_DIR } from '../../shared/workspaceManifest.ts'

const COMPANY_WORKSPACE_ID = 'ws-company'

function upgradeCompanyCockpitManifest(workspaceId: string, manifest: WorkspaceManifest): WorkspaceManifest {
  if (workspaceId !== COMPANY_WORKSPACE_ID) return manifest
  const hasCockpit =
    manifest.ui.spaceProfile === 'cockpit' &&
    (manifest.ui.cockpit?.left?.length ?? 0) + (manifest.ui.cockpit?.right?.length ?? 0) > 0
  if (hasCockpit) return manifest
  const next: WorkspaceManifest = {
    ...manifest,
    ui: {
      ...manifest.ui,
      spaceProfile: 'cockpit',
      cockpit: manifest.ui.cockpit ?? DEFAULT_COMPANY_COCKPIT,
    },
  }
  storagePut(workspaceId, MANIFEST_FILENAME, JSON.stringify(next, null, 2))
  setWorkspacePlatform(workspaceId, next.ui.platform)
  return next
}
import { syncInstancesFromCatalog } from './moduleRegistry.ts'

export function defaultManifest(workspaceId: string, displayName: string): WorkspaceManifest {
  const platform = getWorkspacePlatform(workspaceId)
  return {
    version: 1,
    revision: 1,
    displayName,
    modules: {
      enabledCatalogIds: [...MCP_TOOL_NAMES, 'bridge:list'],
      instances: undefined,
    },
    dataSources: [],
    ui: { platform, defaultCanvasLayout: 'stack' },
    deployments: [],
    customMcpMounts: [],
    canvasMergeMode: 'merge',
  }
}

export function loadManifest(workspaceId: string, displayName: string): WorkspaceManifest {
  const raw = storageGet(workspaceId, MANIFEST_FILENAME)
  if (!raw) {
    const m = syncInstancesFromCatalog(defaultManifest(workspaceId, displayName))
    saveManifest(workspaceId, m, { skipHistory: true })
    return m
  }
  const parsed = syncInstancesFromCatalog(JSON.parse(raw.toString()) as WorkspaceManifest)
  return upgradeCompanyCockpitManifest(workspaceId, parsed)
}

export function saveManifest(
  workspaceId: string,
  manifest: WorkspaceManifest,
  opts?: { skipHistory?: boolean },
) {
  const prev = storageGet(workspaceId, MANIFEST_FILENAME)
  if (prev && !opts?.skipHistory) {
    const prevJson = JSON.parse(prev.toString()) as WorkspaceManifest
    storagePut(
      workspaceId,
      `${MANIFEST_HISTORY_DIR}/rev-${prevJson.revision}.json`,
      prev.toString(),
    )
  }
  manifest.revision = (manifest.revision ?? 0) + (opts?.skipHistory ? 0 : 1)
  storagePut(workspaceId, MANIFEST_FILENAME, JSON.stringify(manifest, null, 2))
  setWorkspacePlatform(workspaceId, manifest.ui.platform)
}

export function loadManifestRevision(workspaceId: string, revision: number) {
  const raw = storageGet(workspaceId, `${MANIFEST_HISTORY_DIR}/rev-${revision}.json`)
  if (!raw) return null
  return JSON.parse(raw.toString()) as WorkspaceManifest
}

export function diffManifestLines(before: string, after: string) {
  const a = before.split('\n')
  const b = after.split('\n')
  const lines: { type: 'same' | 'add' | 'del'; text: string }[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    const x = a[i]
    const y = b[i]
    if (x === y) lines.push({ type: 'same', text: x ?? '' })
    else {
      if (x !== undefined) lines.push({ type: 'del', text: x })
      if (y !== undefined) lines.push({ type: 'add', text: y })
    }
  }
  return lines
}
