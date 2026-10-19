import { MCP_TOOL_NAMES } from '../mcp/handlers.ts'
import { buildMcpCatalog } from '../mcp/catalog.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { listBuilderSkills } from './registry.ts'

export type SetupContext = {
  displayName: string
  enabledModuleCount: number
  dataSourceCount: number
  gaps: string[]
  suggestedSkillIds: string[]
  availableCatalogIds: string[]
  enabledCatalogIds: string[]
}

export function analyzeSetupContext(manifest: WorkspaceManifest): SetupContext {
  const enabled = manifest.modules.enabledCatalogIds ?? []
  const gaps: string[] = []
  const suggestedSkillIds: string[] = ['workspace-build']

  if (manifest.dataSources.length === 0) {
    gaps.push('尚未設定資料源（資料庫／API）；模組目前多為示範資料')
    suggestedSkillIds.push('data-source')
  }
  if (enabled.length < 3) {
    gaps.push('啟用的模組較少，側欄可能偏空')
    suggestedSkillIds.push('modules-enable')
  }
  if (!gaps.length) {
    suggestedSkillIds.push('canvas-blocks')
  }

  const catalog = buildMcpCatalog(undefined, manifest)
  const availableCatalogIds = catalog.map((c) => c.id)
  const allTools = [...MCP_TOOL_NAMES, 'bridge:list']

  return {
    displayName: manifest.displayName,
    enabledModuleCount: enabled.length,
    dataSourceCount: manifest.dataSources.length,
    gaps,
    suggestedSkillIds: [...new Set(suggestedSkillIds)],
    availableCatalogIds: availableCatalogIds.length ? availableCatalogIds : [...allTools],
    enabledCatalogIds: enabled,
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
