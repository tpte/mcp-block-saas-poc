import type { DataSourceRecord, WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { loadManifest, saveManifest } from '../workspaces/manifest.ts'
import type { SessionContext } from '../../shared/domain.ts'
import { logManifestEdit } from '../ops/record.ts'

const DS_TYPES = ['postgres', 'supabase', 'sqlite', 'http_api'] as const

export function slugifyId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
}

export function validateDataSourceInput(input: {
  id?: string
  label: string
  type: string
  secretRef?: string
}): DataSourceRecord {
  const label = input.label?.trim()
  if (!label || label.length < 2) throw new Error('請填寫資料源名稱（至少 2 字）')
  const type = input.type as DataSourceRecord['type']
  if (!DS_TYPES.includes(type)) throw new Error(`不支援的資料源類型：${input.type}`)
  const id = (input.id?.trim() || `ds-${slugifyId(label) || 'primary'}`).slice(0, 48)
  const secretRef =
    input.secretRef?.trim() ||
    (type === 'sqlite' ? 'builtin:workspace-sqlite' : `env:WORKSPACE_${id.replace(/-/g, '_').toUpperCase()}`)
  return {
    id,
    type,
    label,
    secretRef,
    health: 'unknown',
  }
}

export function appendManifestDataSource(session: SessionContext, record: DataSourceRecord) {
  const manifest = loadManifest(session.workspace.id, session.workspace.name)
  if (manifest.dataSources.some((d) => d.id === record.id)) {
    throw new Error(`資料源 id 已存在：${record.id}`)
  }
  manifest.dataSources.push(record)
  saveManifest(session.workspace.id, manifest)
  logManifestEdit(session, manifest.revision)
  return manifest
}

export function setEnabledModules(session: SessionContext, enabledCatalogIds: string[]) {
  const manifest = loadManifest(session.workspace.id, session.workspace.name)
  manifest.modules.enabledCatalogIds = [...new Set(enabledCatalogIds)]
  saveManifest(session.workspace.id, manifest)
  logManifestEdit(session, manifest.revision)
  return manifest
}

export function listManifestDataSources(session: SessionContext) {
  const manifest = loadManifest(session.workspace.id, session.workspace.name)
  return manifest.dataSources
}
