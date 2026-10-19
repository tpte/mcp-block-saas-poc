import { randomUUID } from 'node:crypto'
import type { BlockPackage } from '../../shared/domain.ts'
import { getDb, getPublishedBlockPackages, listBlockPackages, upsertBlockPackage } from '../db/store.ts'
import { storageGet, storagePut } from '../storage/workspaceStorage.ts'

export function submitBlockPackage(input: {
  workspaceId: string
  authorUserId: string
  name: string
  version: string
  componentId: string
  propsSchema: Record<string, unknown>
  bundle: Record<string, unknown>
}) {
  const id = randomUUID()
  const bundlePath = `blocks/${input.name}@${input.version}.json`
  storagePut(input.workspaceId, bundlePath, JSON.stringify(input.bundle))
  const pkg: BlockPackage = {
    id,
    workspaceId: input.workspaceId,
    authorUserId: input.authorUserId,
    name: input.name,
    version: input.version,
    componentId: input.componentId,
    propsSchemaJson: JSON.stringify(input.propsSchema),
    bundlePath,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  upsertBlockPackage(pkg)
  return pkg
}

export function approveBlockPackage(workspaceId: string, id: string, publish = true) {
  const pkg = getDb().blockPackages.find((p) => p.id === id && p.workspaceId === workspaceId)
  if (!pkg) throw new Error('package not found')
  pkg.status = publish ? 'published' : 'approved'
  upsertBlockPackage(pkg)
  return pkg
}

export function loadPublishedBundle(workspaceId: string, componentId: string) {
  const pkg = getPublishedBlockPackages(workspaceId).find((p) => p.componentId === componentId)
  if (!pkg) return null
  const raw = storageGet(workspaceId, pkg.bundlePath)
  if (!raw) return null
  return { pkg, bundle: JSON.parse(raw.toString()) as Record<string, unknown> }
}

export function listPackagesForWorkspace(workspaceId: string) {
  return listBlockPackages(workspaceId)
}
