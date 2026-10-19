import type { DataSourceRecord } from '../../shared/workspaceManifest.ts'
import { getOpenRouterKey } from '../env.ts'

export async function probeDataSource(ds: DataSourceRecord): Promise<DataSourceRecord['health']> {
  if (ds.type === 'http_api') {
    const url = process.env[ds.secretRef.replace(/^env:/, '')]
    if (!url) return 'unknown'
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
      return res.ok ? 'healthy' : 'degraded'
    } catch {
      return 'down'
    }
  }
  if (ds.type === 'postgres' || ds.type === 'supabase' || ds.type === 'sqlite') {
    const key = process.env[ds.secretRef.replace(/^env:/, '')]
    if (!key) return 'unknown'
    return 'healthy'
  }
  return 'unknown'
}

export async function probeAllDataSources(sources: DataSourceRecord[]) {
  return Promise.all(
    sources.map(async (ds) => ({
      ...ds,
      health: await probeDataSource(ds),
    })),
  )
}

export function probeDeployment(url?: string): 'healthy' | 'degraded' | 'down' | 'unknown' {
  if (!url) return 'unknown'
  return 'unknown'
}

export async function probeApiHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  return getOpenRouterKey() ? 'healthy' : 'degraded'
}
