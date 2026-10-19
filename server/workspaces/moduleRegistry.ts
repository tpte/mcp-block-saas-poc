import { MCP_TOOL_NAMES } from '../mcp/handlers.ts'
import {
  BUILTIN_MCP_MODULES,
  LEGACY_MODULE_ID,
  moduleIdForTool,
  toolPrefix,
  type WorkspaceModule,
} from '../../shared/modulePage.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'

function enabledToolPrefixes(manifest: WorkspaceManifest): Set<string> {
  const enabled = manifest.modules.enabledCatalogIds
  if (!enabled?.length) {
    return new Set(BUILTIN_MCP_MODULES.map((m) => m.id))
  }
  const prefixes = new Set<string>()
  for (const tool of enabled) {
    prefixes.add(moduleIdForTool(tool))
  }
  return prefixes
}

export function ensureModuleInstances(manifest: WorkspaceManifest): WorkspaceModule[] {
  if (manifest.modules.instances?.length) {
    return [...manifest.modules.instances].sort((a, b) => a.sort - b.sort)
  }
  const prefixes = enabledToolPrefixes(manifest)
  return BUILTIN_MCP_MODULES.filter((m) => prefixes.has(m.id))
}

export function listWorkspaceModules(manifest: WorkspaceManifest): WorkspaceModule[] {
  return ensureModuleInstances(manifest)
}

export function getWorkspaceModule(manifest: WorkspaceManifest, moduleId: string): WorkspaceModule | null {
  return listWorkspaceModules(manifest).find((m) => m.id === moduleId) ?? null
}

export function toolsForModule(moduleId: string, manifest: WorkspaceManifest): string[] {
  if (moduleId === LEGACY_MODULE_ID) {
    return MCP_TOOL_NAMES.filter((tool) => {
      const enabled = manifest.modules.enabledCatalogIds
      return !enabled?.length || enabled.includes(tool)
    })
  }
  const mod = getWorkspaceModule(manifest, moduleId)
  if (!mod) return []
  const prefix = mod.mcpMountId.replace(/^builtin:/, '')
  const enabled = manifest.modules.enabledCatalogIds
  return MCP_TOOL_NAMES.filter((tool) => {
    if (toolPrefix(tool) !== prefix && !(prefix === 'bridge' && tool === 'bridge:list')) return false
    return !enabled?.length || enabled.includes(tool)
  })
}

export function syncInstancesFromCatalog(manifest: WorkspaceManifest): WorkspaceManifest {
  if (manifest.modules.instances?.length) return manifest
  const instances = ensureModuleInstances(manifest)
  return {
    ...manifest,
    modules: {
      ...manifest.modules,
      instances,
    },
  }
}
