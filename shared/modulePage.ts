import type { CanvasPage } from './ui.ts'

export type ModuleKind = 'mcp' | 'static'

/** One MODULE ≈ one MCP mount (in-process domain or custom mount id). */
export type WorkspaceModule = {
  id: string
  label: string
  kind: ModuleKind
  mcpMountId: string
  sort: number
}

export type ModuleCanvas = CanvasPage & {
  moduleId: string
  revision: number
}

export const MODULE_CANVAS_DIR = 'modules'

export const BUILTIN_MCP_MODULES: WorkspaceModule[] = [
  { id: 'hr', label: 'HR 人資', kind: 'mcp', mcpMountId: 'builtin:hr', sort: 10 },
  { id: 'finance', label: 'Finance 財務', kind: 'mcp', mcpMountId: 'builtin:finance', sort: 20 },
  { id: 'sales', label: 'Sales 業務', kind: 'mcp', mcpMountId: 'builtin:sales', sort: 30 },
  { id: 'inventory', label: 'Inventory 庫存', kind: 'mcp', mcpMountId: 'builtin:inventory', sort: 40 },
  { id: 'support', label: 'Support 客服', kind: 'mcp', mcpMountId: 'builtin:support', sort: 50 },
  { id: 'analytics', label: 'Analytics 報表', kind: 'mcp', mcpMountId: 'builtin:analytics', sort: 60 },
  { id: 'bridge', label: 'Bridge 外部 MCP', kind: 'mcp', mcpMountId: 'builtin:bridge', sort: 70 },
  { id: 'notes', label: 'Notes', kind: 'mcp', mcpMountId: 'builtin:notes', sort: 80 },
]

export const LEGACY_MODULE_ID = '_legacy'

export function toolPrefix(tool: string): string {
  return tool.split(':')[0] ?? tool
}

export function moduleIdForTool(tool: string): string {
  const prefix = toolPrefix(tool)
  if (prefix === 'bridge') return 'bridge'
  return prefix
}
