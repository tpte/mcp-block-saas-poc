import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd(), '.data', 'storage')

export type StorageObject = {
  key: string
  size: number
  updatedAt: string
}

function workspaceDir(workspaceId: string) {
  const dir = join(ROOT, workspaceId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function storagePut(workspaceId: string, key: string, data: string | Buffer) {
  const safe = key.replace(/[^a-zA-Z0-9._/-]/g, '_')
  const path = join(workspaceDir(workspaceId), safe)
  const dir = join(path, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, data)
  return { key: safe, size: Buffer.byteLength(data), updatedAt: new Date().toISOString() }
}

export function storageGet(workspaceId: string, key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._/-]/g, '_')
  const path = join(workspaceDir(workspaceId), safe)
  if (!existsSync(path)) return null
  return readFileSync(path)
}

export function storageRenameWorkspace(oldId: string, newId: string) {
  const from = join(ROOT, oldId)
  const to = join(ROOT, newId)
  if (!existsSync(from)) return false
  if (existsSync(to)) return false
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true })
  renameSync(from, to)
  return true
}

export function storageList(workspaceId: string): StorageObject[] {
  const dir = workspaceDir(workspaceId)
  if (!existsSync(dir)) return []
  return readdirSync(dir).map((name) => {
    const path = join(dir, name)
    const st = statSync(path)
    return { key: name, size: st.size, updatedAt: st.mtime.toISOString() }
  })
}
