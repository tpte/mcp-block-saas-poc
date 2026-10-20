/** Cockpit layout: pinned MCP tool slots on left/right; agent canvas in center. */

export type CockpitSlot = {
  id: string
  label: string
  tool: string
  payload?: Record<string, unknown>
  refreshSec?: number
  /** When true, agent tools must not overwrite this slot (phase 2). */
  locked?: boolean
}

export type CockpitConfig = {
  left: CockpitSlot[]
  right: CockpitSlot[]
}

export const COCKPIT_SLOTS_PER_SIDE_MAX = 2

export const DEFAULT_COMPANY_COCKPIT: CockpitConfig = {
  left: [
    {
      id: 'kpi-week',
      label: '本週 KPI',
      tool: 'analytics:kpi_week',
      locked: true,
    },
  ],
  right: [
    {
      id: 'cashflow',
      label: '現金流',
      tool: 'finance:get_cashflow',
      locked: true,
    },
  ],
}
