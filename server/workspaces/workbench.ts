import { storageGet, storageList, storagePut } from '../storage/workspaceStorage.ts'
import { MANIFEST_FILENAME } from '../../shared/workspaceManifest.ts'

const ALLOWED_PREFIXES = ['manifest.json', 'manifest-history/', 'blocks/', 'workbench/']

export function assertWorkbenchPath(key: string) {
  const safe = key.replace(/\\/g, '/').replace(/^\/+/, '')
  if (safe.includes('..')) throw new Error('路徑不允許')
  if (safe.startsWith('.env') || safe.includes('/.env')) throw new Error('禁止存取 env')
  if (!ALLOWED_PREFIXES.some((p) => safe === p.replace(/\/$/, '') || safe.startsWith(p))) {
    throw new Error('路徑不在 allowlist')
  }
  return safe
}

export function listWorkbenchFiles(workspaceId: string) {
  return storageList(workspaceId).filter((o) => {
    try {
      assertWorkbenchPath(o.key)
      return true
    } catch {
      return o.key === MANIFEST_FILENAME
    }
  })
}

export function readWorkbenchFile(workspaceId: string, key: string) {
  const safe = assertWorkbenchPath(key)
  const buf = storageGet(workspaceId, safe)
  return buf ? buf.toString('utf8') : null
}

export function writeWorkbenchFile(workspaceId: string, key: string, content: string) {
  const safe = assertWorkbenchPath(key)
  storagePut(workspaceId, safe, content)
  return safe
}
