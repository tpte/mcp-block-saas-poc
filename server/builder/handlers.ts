import type { McpUiResponse } from '../../shared/ui.ts'
import { getSession } from '../requestContext.ts'
import { canManageManifest } from '../workspaces/rbac.ts'
import { loadManifest, saveManifest } from '../workspaces/manifest.ts'
import { logManifestEdit } from '../ops/record.ts'
import type { WorkspaceManifest } from '../../shared/workspaceManifest.ts'
import {
  commitManifestPatch,
  previewManifestPatch,
  validateDataSourceInput,
  type ManifestPatchInput,
} from './manifestOps.ts'
import {
  WORKSPACE_TEMPLATES,
  type WorkspaceTemplateId,
  listWorkspaceTemplateMeta,
} from '../../shared/workspaceTemplates.ts'
import { readBuilderSkill, searchBuilderKnowledge, listBuilderSkills } from './registry.ts'
import { analyzeSetupContext, formatSetupContextForPrompt } from './setupContext.ts'
import { speechToBlocks } from '../mcp/compose.ts'
import { buildWelcomeBlocks } from './welcomeCanvas.ts'

export const BUILDER_TOOL_NAMES = [
  'builder:get_setup_context',
  'builder:read_skill',
  'builder:search_knowledge',
  'builder:list_templates',
  'builder:apply_template',
  'builder:preview_manifest',
  'builder:update_manifest',
] as const

function patchFromPayload(payload?: Record<string, unknown>): ManifestPatchInput {
  const patch: ManifestPatchInput = {}
  const enabledCatalogIds = payload?.enabledCatalogIds as string[] | undefined
  if (enabledCatalogIds?.length) patch.enabledCatalogIds = enabledCatalogIds
  const appendDataSource = payload?.appendDataSource as Record<string, unknown> | undefined
  if (appendDataSource?.label) {
    patch.appendDataSource = validateDataSourceInput({
      id: String(appendDataSource.id ?? ''),
      label: String(appendDataSource.label),
      type: String(appendDataSource.type ?? 'postgres'),
      secretRef: appendDataSource.secretRef ? String(appendDataSource.secretRef) : undefined,
    })
  }
  const displayName = payload?.displayName as string | undefined
  if (displayName?.trim()) patch.displayName = displayName.trim()
  return patch
}

function requireManifestAdmin() {
  const session = getSession()
  if (!canManageManifest(session)) throw new Error('需要 admin 以上才能修改 manifest／模板')
  return session
}

export function builderGetSetupContext(): McpUiResponse {
  const { workspace } = getSession()
  const manifest = loadManifest(workspace.id, workspace.name)
  const ctx = analyzeSetupContext(manifest)
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
      ],
    },
  }
}

export function builderReadSkill(payload?: Record<string, unknown>) {
  const skillId = String(payload?.skillId ?? '').trim()
  if (!skillId) throw new Error('請提供 skillId')
  const body = readBuilderSkill(skillId)
  const preview = body.slice(0, 420).trim()
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnAlertBlock',
          blockId: `builder-skill-${skillId}`,
          presentation: { role: 'context', collapsible: true, priority: 2 },
          props: {
            variant: 'default',
            title: `已讀 Skill：${skillId}`,
            description: `${preview}${body.length > 420 ? '…（Agent 已讀完整 SKILL，會用白話帶你）' : ''}`,
          },
        },
      ],
    },
  }
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
  let templateId = String(payload?.templateId ?? '')
  if (templateId === 'hiyen-starter') templateId = 'company-starter'
  const confirm = Boolean(payload?.confirm)
  const tpl = WORKSPACE_TEMPLATES[templateId as WorkspaceTemplateId]
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
  const ctx = analyzeSetupContext(next)
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: buildWelcomeBlocks({
        title: `已還原模板：${tpl.label}`,
        ctx,
        footnote: '細節請跟 Agent 對話或使用 Skills，不要只靠模板。',
      }),
    },
  }
}

export function builderPreviewManifest(payload?: Record<string, unknown>) {
  const session = getSession()
  const patch = patchFromPayload(payload)
  const { summary, diff } = previewManifestPatch(session, patch)
  const diffPreview = diff
    .filter((l) => l.type !== 'same')
    .slice(0, 24)
    .map((l) => `${l.type === 'add' ? '+' : '-'} ${l.text}`)
    .join('\n')
  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnDocumentBlock',
          blockId: 'builder-preview',
          props: {
            title: 'Manifest 變更預覽',
            body: `${summary}\n\n${diffPreview || '（無 diff 行）'}`,
          },
        },
      ],
    },
  }
}

export function builderUpdateManifest(payload?: Record<string, unknown>) {
  const session = requireManifestAdmin()
  const patch = patchFromPayload(payload)
  const confirm = payload?.confirm !== false

  if (!confirm) {
    const { summary } = previewManifestPatch(session, patch)
    return {
      action: 'RENDER',
      ui: {
        layout: 'stack',
        blocks: [
          {
            type: 'block',
            component: 'ShadcnConfirmBlock',
            blockId: 'builder-manifest-confirm',
            props: {
              title: '套用 manifest 變更？',
              description: `${summary}\n\n確認後才會寫入；可先 builder:preview_manifest 看 diff。`,
              actions: [
                {
                  label: '確認套用',
                  mcpTool: 'builder:update_manifest',
                  payload: { ...payload, confirm: true },
                },
              ],
            },
          },
        ],
      },
    } satisfies McpUiResponse
  }

  const manifest = commitManifestPatch(session, patch)
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
    case 'builder:preview_manifest':
      return builderPreviewManifest(payload)
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
打造後台時優先 builder:read_skill / builder:search_knowledge，不要臆測流程。
變更 manifest 前先 builder:preview_manifest；寫入用 builder:update_manifest（confirm=false 出確認鈕，true 才套用）。模板還原用 builder:apply_template。`
}
