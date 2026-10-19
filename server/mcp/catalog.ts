import { toCanvas } from '../../shared/ui.ts'
import { MCP_TOOL_NAMES } from './handlers.ts'
import { listMountedMcps } from './bridge.ts'

export type CatalogItem = {
  id: string
  label: string
  group: string
  tool: string
  defaultPayload?: Record<string, unknown>
}

const DOMAIN_LABELS: Record<string, string> = {
  hr: 'HR 人資',
  finance: 'Finance 財務',
  sales: 'Sales 業務',
  inventory: 'Inventory 庫存',
  support: 'Support 客服',
  analytics: 'Analytics 報表',
  bridge: 'Bridge 外部',
}

const TOOL_LABELS: Record<string, string> = {
  'hr:get_leave': '本月員工請假明細',
  'hr:approve_all': '核准全部請假',
  'finance:get_cashflow': '本月現金流與趨勢',
  'finance:list_invoices': '待付發票列表',
  'sales:pipeline': '業務 Pipeline 看板',
  'sales:create_lead': '新增潛在客戶',
  'inventory:stock_alerts': '庫存警示',
  'inventory:reorder': '危急 SKU 補貨',
  'support:open_tickets': '未結客服工單',
  'support:assign': '指派第一張工單',
  'analytics:kpi_week': '本週 KPI',
  'analytics:channel_mix': '渠道流量占比',
  'bridge:list': '已掛載外部 MCP 列表',
}

function groupFromTool(tool: string) {
  const prefix = tool.split(':')[0]
  return DOMAIN_LABELS[prefix] ?? prefix
}

export function buildMcpCatalog(_workspaceId?: string, manifest?: { modules?: { enabledCatalogIds?: string[] } }): CatalogItem[] {
  const enabled = manifest?.modules?.enabledCatalogIds
  const items: CatalogItem[] = MCP_TOOL_NAMES.filter((tool) => !enabled || enabled.includes(tool)).map((tool) => ({
    id: tool,
    label: TOOL_LABELS[tool] ?? tool,
    group: groupFromTool(tool),
    tool,
  }))

  if (!enabled || enabled.includes('bridge:list')) {
    items.push({
      id: 'bridge:list',
      label: TOOL_LABELS['bridge:list'] ?? 'Bridge 列表',
      group: DOMAIN_LABELS.bridge,
      tool: 'bridge:list',
    })
  }

  const bridgeUi = listMountedMcps()
  const canvas = bridgeUi.action === 'RENDER' ? toCanvas(bridgeUi.ui) : null
  const tableBlock = canvas?.blocks.find((b) => b.blockId === 'bridge-tools') ?? null
  const rows = (tableBlock?.props.data ?? []) as { server?: string; tool?: string; description?: string; id?: string }[]
  for (const row of rows) {
    if (!row.server || !row.tool) continue
    items.push({
      id: `${row.server}:${row.tool}`,
      label: `${row.server} · ${row.tool}`,
      group: DOMAIN_LABELS.bridge,
      tool: 'bridge:call',
      defaultPayload: { server: row.server, tool: row.tool, args: {} },
    })
  }

  return items
}
