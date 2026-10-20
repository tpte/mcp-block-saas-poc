import type { CockpitConfig } from './cockpit.ts'
import type { PlatformConfig } from './platform.ts'
import type { McpMountRecord } from './domain.ts'
import type { DefaultCanvasLayout } from './platform.ts'
import type { WorkspaceModule } from './modulePage.ts'

export type DataSourceType = 'postgres' | 'supabase' | 'sqlite' | 'http_api'

export type DataSourceRecord = {
  id: string
  type: DataSourceType
  label: string
  secretRef: string
  allowedSchemas?: string[]
  health?: 'healthy' | 'degraded' | 'down' | 'unknown'
}

export type GitBinding = {
  provider: 'github'
  repo: string
  branch: string
  lastSyncAt?: string
}

export type SpaceProfile = 'default' | 'admin' | 'ide' | 'cockpit'

export type DeploymentRecord = {
  id: string
  target: 'railway'
  serviceId?: string
  url?: string
  status?: 'healthy' | 'degraded' | 'down' | 'unknown'
}

export type WorkspaceManifest = {
  version: 1
  revision: number
  displayName: string
  modules: {
    /** @deprecated use instances + per-module tool filter */
    enabledCatalogIds?: string[]
    instances?: WorkspaceModule[]
  }
  dataSources: DataSourceRecord[]
  ui: {
    platform: PlatformConfig
    defaultCanvasLayout: DefaultCanvasLayout
    spaceProfile?: SpaceProfile
    cockpit?: CockpitConfig
  }
  git?: GitBinding
  deployments: DeploymentRecord[]
  customMcpMounts: McpMountRecord[]
  canvasMergeMode: 'merge' | 'replace'
}

export const MANIFEST_FILENAME = 'manifest.json'
export const MANIFEST_HISTORY_DIR = 'manifest-history'
