import type { McpUiResponse } from '../../shared/ui.ts'
import { getSession } from '../requestContext.ts'
import { canManageManifest } from '../workspaces/rbac.ts'
import { loadManifest, saveManifest } from '../workspaces/manifest.ts'
import { logManifestEdit } from '../ops/record.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import { appendManifestDataSource, setEnabledModules, validateDataSourceInput } from './manifestOps.ts'
import {
  WORKSPACE_TEMPLATES,
  type WorkspaceTemplateId,
  listWorkspaceTemplateMeta,
} from '../../shared/workspaceTemplates.ts'
import { readBuilderSkill, searchBuilderKnowledge, listBuilderSkills } from './registry.ts'
import { analyzeSetupContext, formatSetupContextForPrompt } from './setupContext.ts'
import { speechToBlocks } from '../mcp/compose.ts'

export const BUILDER_TOOL_NAMES = [
  'builder:get_setup_context',
  'builder:read_skill',
  'builder:search_knowledge',
  'builder:list_templates',
  'builder:apply_template',
  'builder:update_manifest',
] as const

function requireManifestAdmin() {
  const session = getSession()
  if (!canManageManifest(session)) throw new Error('需要 admin 以上才能修改 manifest／模板')
  return session
}

export function builderGetSetupContext(): McpUiResponse {
  const { workspace } = getSession()
  const manifest = loadManifest(workspace.id, workspace.name)
  const ctx = analyzeSetupContext(manifest)
  const prompt = formatSetupContextForPrompt(ctx)
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnAlertBlock',
          blockId: 'builder-setup-context',
          props: {
            variant: 'default',
            title: '打造後台 · 目前狀態',
            description: ctx.gaps.length ? ctx.gaps.join('\n') : '可繼續跟 Agent 客製模組與畫布。',
          },
        },
        {
          type: 'block',
          component: 'ShadcnDocumentBlock',
          blockId: 'builder-setup-detail',
          props: {
            title: 'Agent 參考摘要',
            body: prompt,
          },
        },
      ],
    },
  }
}

export function builderReadSkill(payload?: Record<string, unknown>) {
  const skillId = String(payload?.skillId ?? '').trim()
  if (!skillId) throw new Error('請提供 skillId')
  const body = readBuilderSkill(skillId)
  return speechToBlocks(`已載入 skill「${skillId}」：\n\n${body.slice(0, 6000)}`)
}

export function builderSearchKnowledge(payload?: Record<string, unknown>) {
  const query = String(payload?.query ?? '').trim()
  if (!query) throw new Error('請提供 query')
  const hits = searchBuilderKnowledge(query, Number(payload?.limit ?? 5))
  const body =
    hits.length === 0
      ? '知識庫沒有命中，請改寫關鍵字或直接用 read_skill。'
      : hits.map((h) => `### ${h.source}\n${h.body.slice(0, 1500)}`).join('\n\n---\n\n')
  return speechToBlocks(body)
}

export function builderListTemplates() {
  const items = listWorkspaceTemplateMeta()
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnDocumentBlock',
          blockId: 'builder-templates',
          props: {
            title: '可還原的工作區模板',
            body: items.map((t) => `- **${t.id}**：${t.label} — ${t.description}`).join('\n'),
          },
        },
      ],
    },
  } satisfies McpUiResponse
}

export function builderApplyTemplate(payload?: Record<string, unknown>) {
  const session = requireManifestAdmin()
  const templateId = String(payload?.templateId ?? '') as WorkspaceTemplateId
  const confirm = Boolean(payload?.confirm)
  const tpl = WORKSPACE_TEMPLATES[templateId]
  if (!tpl) throw new Error(`未知模板：${templateId}`)
  if (!confirm) {
    return {
      action: 'RENDER',
      ui: {
        layout: 'stack',
        blocks: [
          {
            type: 'block',
            component: 'ShadcnConfirmBlock',
            blockId: 'builder-template-confirm',
            props: {
              title: `還原模板：${tpl.label}`,
              description: `${tpl.description}\n\n這會覆寫 manifest（模組、資料源、UI 標題等）。`,
              actions: [
                {
                  label: '確認還原',
                  mcpTool: 'builder:apply_template',
                  payload: { templateId, confirm: true },
                },
              ],
            },
          },
        ],
      },
    } satisfies McpUiResponse
  }

  const prev = loadManifest(session.workspace.id, session.workspace.name)
  const next: WorkspaceManifest = {
    ...tpl.manifest,
    revision: prev.revision,
    displayName: tpl.manifest.displayName || session.workspace.name,
    ui: {
      ...tpl.manifest.ui,
      platform: {
        ...tpl.manifest.ui.platform,
        title: tpl.manifest.ui.platform.title || session.workspace.name,
      },
    },
  }
  saveManifest(session.workspace.id, next)
  logManifestEdit(session, next.revision)
  return speechToBlocks(`已還原模板「${tpl.label}」。接下來可跟 Agent 調整細節（非寫死流程）。`)
}

export function builderUpdateManifest(payload?: Record<string, unknown>) {
  const session = requireManifestAdmin()
  let manifest = loadManifest(session.workspace.id, session.workspace.name)
  const enabledCatalogIds = payload?.enabledCatalogIds as string[] | undefined
  const appendDataSource = payload?.appendDataSource as Record<string, unknown> | undefined
  const displayName = payload?.displayName as string | undefined

  if (enabledCatalogIds?.length) {
    manifest = setEnabledModules(session, enabledCatalogIds)
  }
  if (appendDataSource?.label) {
    const record = validateDataSourceInput({
      id: String(appendDataSource.id ?? ''),
      label: String(appendDataSource.label),
      type: String(appendDataSource.type ?? 'postgres'),
      secretRef: appendDataSource.secretRef ? String(appendDataSource.secretRef) : undefined,
    })
    manifest = appendManifestDataSource(session, record)
  }
  if (displayName?.trim()) {
    manifest.displayName = displayName.trim().slice(0, 80)
    saveManifest(session.workspace.id, manifest)
    logManifestEdit(session, manifest.revision)
  }

  const ctx = analyzeSetupContext(manifest)
  return speechToBlocks(
    `已更新 manifest。模組 ${ctx.enabledModuleCount} 個，資料源 ${ctx.dataSourceCount} 個。${ctx.gaps.length ? `提醒：${ctx.gaps[0]}` : ''}`,
  )
}

export function invokeBuilderTool(name: string, payload?: Record<string, unknown>): McpUiResponse | null {
  switch (name) {
    case 'builder:get_setup_context':
      return builderGetSetupContext()
    case 'builder:read_skill':
      return builderReadSkill(payload)
    case 'builder:search_knowledge':
      return builderSearchKnowledge(payload)
    case 'builder:list_templates':
      return builderListTemplates()
    case 'builder:apply_template':
      return builderApplyTemplate(payload)
    case 'builder:update_manifest':
      return builderUpdateManifest(payload)
    default:
      return null
  }
}

export function builderSystemPromptAddon() {
  const { workspace } = getSession()
  const manifest = loadManifest(workspace.id, workspace.name)
  const ctx = analyzeSetupContext(manifest)
  const skillIndex = listBuilderSkills().map((s) => s.id).join(', ')
  return `${formatSetupContextForPrompt(ctx)}

## Builder 工具
可用 skill id：${skillIndex}
打造後台時優先 builder:read_skill / builder:search_knowledge，不要臆測流程；模板還原用 builder:apply_template（需使用者確認）。`
}
