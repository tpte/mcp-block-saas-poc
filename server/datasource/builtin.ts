import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd(), '.data', 'storage')

export function workspaceSqlitePath(workspaceId: string, dataSourceId: string) {
  const dir = join(ROOT, workspaceId, 'datasources')
  return join(dir, `${dataSourceId}.sqlite`)
}

/** 建立空 SQLite 檔占位，免 env；日後可接 better-sqlite3 */
export function ensureWorkspaceSqlite(workspaceId: string, dataSourceId: string) {
  const dir = join(ROOT, workspaceId, 'datasources')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const path = workspaceSqlitePath(workspaceId, dataSourceId)
  if (!existsSync(path)) writeFileSync(path, '')
  return path
}

export function isBuiltinSecretRef(secretRef: string) {
  return secretRef.startsWith('builtin:')
}

export function probeBuiltinDataSource(
  workspaceId: string,
  secretRef: string,
  dataSourceId: string,
): 'healthy' | 'degraded' | 'unknown' {
  if (secretRef === 'builtin:demo') return 'healthy'
  if (secretRef === 'builtin:workspace-sqlite') {
    ensureWorkspaceSqlite(workspaceId, dataSourceId)
    return existsSync(workspaceSqlitePath(workspaceId, dataSourceId)) ? 'healthy' : 'degraded'
  }
  return 'unknown'
}

export function describeDataSourceForUser(input: {
  label: string
  type: string
  secretRef: string
  health: string
}): string {
  const { label, type, secretRef, health } = input
  if (health === 'healthy') {
    if (secretRef === 'builtin:workspace-sqlite') {
      return `${label}：本機 SQLite 已就緒，可開始規劃表單與模組。`
    }
    if (secretRef === 'builtin:demo') return `${label}：內建範例資料，可直接操作模組。`
    return `${label}：連線狀態良好（${type}）。`
  }
  if (secretRef.startsWith('env:') && health === 'unknown') {
    const envKey = secretRef.replace(/^env:/, '')
    return `${label}：尚待設定環境變數 ${envKey}（請 admin 在 Railway／本機 .env 設定，勿在聊天貼密碼）。`
  }
  if (health === 'down') return `${label}：連線失敗，請檢查 URL 或網路。`
  if (health === 'degraded') return `${label}：連線異常，請稍後再試或聯絡 admin。`
  return `${label}：狀態未知，請跟 Agent 用 data-source skill 排查。`
}
