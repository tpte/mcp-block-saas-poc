import type { DataSourceRecord, WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { diffManifestLines, loadManifest, saveManifest } from '../workspaces/manifest.ts'
import type { SessionContext } from '../../shared/domain.ts'
import { logManifestEdit } from '../ops/record.ts'
import { ensureWorkspaceSqlite, isBuiltinSecretRef } from '../datasource/builtin.ts'

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
  if (isBuiltinSecretRef(record.secretRef) && record.secretRef === 'builtin:workspace-sqlite') {
    ensureWorkspaceSqlite(session.workspace.id, record.id)
  }
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

export type ManifestPatchInput = {
  enabledCatalogIds?: string[]
  appendDataSource?: DataSourceRecord
  displayName?: string
}

export function applyManifestPatch(manifest: WorkspaceManifest, patch: ManifestPatchInput) {
  const next: WorkspaceManifest = JSON.parse(JSON.stringify(manifest)) as WorkspaceManifest
  if (patch.enabledCatalogIds) {
    next.modules.enabledCatalogIds = [...new Set(patch.enabledCatalogIds)]
  }
  if (patch.appendDataSource) {
    if (!next.dataSources.some((d) => d.id === patch.appendDataSource!.id)) {
      next.dataSources.push(patch.appendDataSource)
    }
  }
  if (patch.displayName?.trim()) {
    next.displayName = patch.displayName.trim().slice(0, 80)
  }
  return next
}

export function commitManifestPatch(session: SessionContext, patch: ManifestPatchInput) {
  const current = loadManifest(session.workspace.id, session.workspace.name)
  const next = applyManifestPatch(current, patch)
  if (patch.appendDataSource && isBuiltinSecretRef(patch.appendDataSource.secretRef)) {
    if (patch.appendDataSource.secretRef === 'builtin:workspace-sqlite') {
      ensureWorkspaceSqlite(session.workspace.id, patch.appendDataSource.id)
    }
  }
  saveManifest(session.workspace.id, next)
  logManifestEdit(session, next.revision)
  return next
}

export function previewManifestPatch(session: SessionContext, patch: ManifestPatchInput) {
  const current = loadManifest(session.workspace.id, session.workspace.name)
  const next = applyManifestPatch(current, patch)
  const diff = diffManifestLines(JSON.stringify(current, null, 2), JSON.stringify(next, null, 2))
  const summary: string[] = []
  if (patch.enabledCatalogIds) {
    const added = patch.enabledCatalogIds.filter((id) => !current.modules.enabledCatalogIds.includes(id))
    const removed = current.modules.enabledCatalogIds.filter((id) => !patch.enabledCatalogIds!.includes(id))
    if (added.length) summary.push(`新增模組 ${added.length} 個`)
    if (removed.length) summary.push(`移除模組 ${removed.length} 個`)
  }
  if (patch.appendDataSource) summary.push(`新增資料源：${patch.appendDataSource.label}`)
  if (patch.displayName) summary.push(`工作區顯示名稱 → ${patch.displayName}`)
  return { current, next, diff, summary: summary.join(' · ') || '無變更' }
}
