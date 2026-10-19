import { BLOCK_TEMPLATES } from '../../shared/blockTemplates.ts'
import { buildMcpCatalog } from '../mcp/catalog.ts'
import type { BlockProps } from '../../shared/ui.ts'
import { loadManifest } from '../workspaces/manifest.ts'

export function validateBlockProps(component: string, props: BlockProps, workspaceId: string, workspaceName: string) {
  const tpl = BLOCK_TEMPLATES.find((t) => t.component === component)
  if (!tpl) return { ok: true as const, props }
  const out: BlockProps = { ...props }
  for (const field of tpl.editableFields) {
    const val = out[field.key]
    if (field.type === 'string' && typeof val === 'string' && field.maxLength) {
      out[field.key] = val.slice(0, field.maxLength) as never
    }
    if (field.type === 'string[]' && Array.isArray(val) && field.maxItems) {
      out[field.key] = val.slice(0, field.maxItems) as never
    }
    if (field.type === 'enum' && typeof val === 'string' && !field.options.includes(val)) {
      throw new Error(`欄位 ${String(field.key)} 值不合法`)
    }
  }
  if (props.actions?.length) {
    const manifest = loadManifest(workspaceId, workspaceName)
    const catalog = new Set(buildMcpCatalog(workspaceId, manifest).map((c) => c.tool))
    for (const action of props.actions) {
      if (!catalog.has(action.mcpTool)) throw new Error(`未啟用的 tool：${action.mcpTool}`)
    }
  }
  return { ok: true as const, props: out }
}
