import type { PlatformConfig } from './platform.ts'
import { DEFAULT_LAYOUT_PREFERENCES } from './platform.ts'
import type { WorkspaceManifest } from './workspaceManifest.ts'
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from './product.ts'

function defaultPlatform(): PlatformConfig {
  return {
    theme: 'light',
    composerPosition: 'bottom',
    composerWidth: 'narrow',
    placeholder: '跟 Agent 說你想看什麼…',
    showHistory: true,
    suggestionsEnabled: true,
    suggestionCount: 3,
    title: PRODUCT_NAME,
    subtitle: PRODUCT_SUBTITLE,
    canvasMaxWidth: 'xl',
    density: 'comfortable',
    showModelBadge: true,
    moduleSidebarEnabled: true,
    modulePillsEnabled: false,
    commandPaletteEnabled: true,
    showToolTrace: true,
    keyboardShortcuts: {},
    layoutPreferences: { ...DEFAULT_LAYOUT_PREFERENCES },
  }
}

export type WorkspaceTemplateId = 'blank-custom' | 'hiyen-starter' | 'erp-demo'

export type WorkspaceTemplate = {
  id: WorkspaceTemplateId
  label: string
  description: string
  /** 還原時是否保留現有 revision 遞增（由 server 處理） */
  manifest: Omit<WorkspaceManifest, 'revision'> & { revision?: number }
}

const baseUi = {
  platform: defaultPlatform(),
  defaultCanvasLayout: 'stack' as const,
}

export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplateId, WorkspaceTemplate> = {
  'blank-custom': {
    id: 'blank-custom',
    label: '空白自訂',
    description: '最少模組，適合從零跟 Agent 對話打造。',
    manifest: {
      version: 1,
      displayName: '我的後台',
      modules: { enabledCatalogIds: ['analytics:kpi_week'] },
      dataSources: [],
      ui: baseUi,
      deployments: [],
      customMcpMounts: [],
      canvasMergeMode: 'merge',
    },
  },
  'hiyen-starter': {
    id: 'hiyen-starter',
    label: 'HIYEN 型入門',
    description: '常見公司後台模組組合 + 資料源占位，可再微調。',
    manifest: {
      version: 1,
      displayName: '公司後台',
      modules: {
        enabledCatalogIds: [
          'hr:get_leave',
          'hr:approve_all',
          'finance:get_cashflow',
          'finance:list_invoices',
          'support:open_tickets',
          'analytics:kpi_week',
          'bridge:list',
        ],
      },
      dataSources: [
        {
          id: 'ds-primary',
          type: 'postgres',
          label: '主要業務資料庫',
          secretRef: 'env:WORKSPACE_DS_PRIMARY',
          health: 'unknown',
        },
      ],
      ui: {
        ...baseUi,
        platform: {
          ...defaultPlatform(),
          title: '公司後台',
          subtitle: '由 MATRIX 與 Agent 共創 · 可隨時改 manifest',
        },
      },
      deployments: [],
      customMcpMounts: [],
      canvasMergeMode: 'merge',
    },
  },
  'erp-demo': {
    id: 'erp-demo',
    label: '完整示範 ERP',
    description: '開啟所有示範模組（含銷售、庫存），適合試玩。',
    manifest: {
      version: 1,
      displayName: '示範 ERP',
      modules: {
        enabledCatalogIds: [
          'hr:get_leave',
          'hr:approve_all',
          'finance:get_cashflow',
          'finance:list_invoices',
          'sales:pipeline',
          'sales:create_lead',
          'inventory:stock_alerts',
          'inventory:reorder',
          'support:open_tickets',
          'support:assign',
          'analytics:kpi_week',
          'analytics:channel_mix',
          'bridge:list',
        ],
      },
      dataSources: [
        {
          id: 'ds-demo',
          type: 'sqlite',
          label: '示範內建資料',
          secretRef: 'builtin:demo',
          health: 'healthy',
        },
      ],
      ui: {
        ...baseUi,
        platform: {
          ...defaultPlatform(),
          title: '示範 ERP',
          subtitle: 'Sample 資料，可還原後再客製',
        },
      },
      deployments: [],
      customMcpMounts: [],
      canvasMergeMode: 'merge',
    },
  },
}

export function listWorkspaceTemplateMeta() {
  return Object.values(WORKSPACE_TEMPLATES).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }))
}
