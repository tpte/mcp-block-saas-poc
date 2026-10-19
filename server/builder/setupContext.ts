import { MCP_TOOL_NAMES } from '../mcp/handlers.ts'
import { buildMcpCatalog } from '../mcp/catalog.ts'
import type { DataSourceRecord, WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { listWorkspaceModules } from '../workspaces/moduleRegistry.ts'
import { listBuilderSkills } from './registry.ts'
import { describeDataSourceForUser } from '../datasource/builtin.ts'
import { probeAllDataSources } from '../workspaces/datasource.ts'

export type SetupContext = {
  displayName: string
  enabledModuleCount: number
  dataSourceCount: number
  gaps: string[]
  suggestedSkillIds: string[]
  availableCatalogIds: string[]
  enabledCatalogIds: string[]
  catalogOptions: { id: string; label: string; group: string }[]
  dataSources: Pick<DataSourceRecord, 'id' | 'label' | 'type' | 'secretRef' | 'health'>[]
  dataSourceMessages: string[]
}

export async function analyzeSetupContextAsync(manifest: WorkspaceManifest, workspaceId: string) {
  const base = analyzeSetupContext(manifest)
  const probed = await probeAllDataSources(manifest.dataSources, workspaceId)
  const dataSourceMessages = probed.map((d) =>
    describeDataSourceForUser({
      label: d.label,
      type: d.type,
      secretRef: d.secretRef,
      health: d.health ?? 'unknown',
    }),
  )
  return {
    ...base,
    dataSources: probed.map((d) => ({
      id: d.id,
      label: d.label,
      type: d.type,
      secretRef: d.secretRef,
      health: d.health,
    })),
    dataSourceMessages,
  }
}

export function analyzeSetupContext(manifest: WorkspaceManifest): SetupContext {
  const enabled = manifest.modules.enabledCatalogIds ?? []
  const moduleInstances = listWorkspaceModules(manifest)
  const gaps: string[] = []
  const suggestedSkillIds: string[] = ['workspace-build']

  if (manifest.dataSources.length === 0) {
    gaps.push('尚未連線資料源，部分模組使用內建範例')
    suggestedSkillIds.push('data-source')
  }
  if (moduleInstances.length < 2) {
    gaps.push('Workspace MODULE（MCP）較少，側欄可能偏空')
    suggestedSkillIds.push('modules-enable')
  }
  if (!gaps.length) {
    suggestedSkillIds.push('canvas-blocks')
  }

  const allTools = [...MCP_TOOL_NAMES, 'bridge:list']
  const fullCatalog = buildMcpCatalog(undefined, { modules: { enabledCatalogIds: allTools } })
  const catalogOptions = fullCatalog.map((c) => ({ id: c.id, label: c.label, group: c.group }))
  const availableCatalogIds = catalogOptions.map((c) => c.id)

  return {
    displayName: manifest.displayName,
    enabledModuleCount: moduleInstances.length,
    dataSourceCount: manifest.dataSources.length,
    gaps,
    suggestedSkillIds: [...new Set(suggestedSkillIds)],
    availableCatalogIds,
    enabledCatalogIds: enabled,
    catalogOptions,
    dataSources: manifest.dataSources.map((d) => ({
      id: d.id,
      label: d.label,
      type: d.type,
      secretRef: d.secretRef,
      health: d.health,
    })),
    dataSourceMessages: [],
  }
}

export function formatSetupContextForPrompt(ctx: SetupContext) {
  const skills = listBuilderSkills()
    .filter((s) => ctx.suggestedSkillIds.includes(s.id))
    .map((s) => `- ${s.id}: ${s.title}`)
    .join('\n')
  return `## 工作區打造快照
名稱：${ctx.displayName}
已啟用模組：${ctx.enabledModuleCount} · 資料源：${ctx.dataSourceCount}
缺口：${ctx.gaps.length ? ctx.gaps.join('；') : '無明顯缺口，可進一步客製畫布'}
建議優先讀的 Skills（用 builder:read_skill）：
${skills || '- workspace-build'}
客製化宗旨：引導靠 Skills+RAG 對話，模板只作還原；細節由使用者與 Agent 共創。`
}
