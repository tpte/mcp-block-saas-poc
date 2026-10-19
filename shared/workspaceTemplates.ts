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
    showHistory: false,
    suggestionsEnabled: true,
    suggestionCount: 3,
    title: PRODUCT_NAME,
    subtitle: PRODUCT_SUBTITLE,
    canvasMaxWidth: 'xl',
    density: 'comfortable',
    showModelBadge: true,
    moduleSidebarEnabled: false,
    modulePillsEnabled: false,
    commandPaletteEnabled: true,
    showToolTrace: true,
    keyboardShortcuts: {},
    layoutPreferences: { ...DEFAULT_LAYOUT_PREFERENCES },
  }
}

export type WorkspaceTemplateId = 'blank-custom' | 'company-starter' | 'erp-demo' | 'dev-ide'

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
  'company-starter': {
    id: 'company-starter',
    label: '公司後台入門',
    description: '常見營運模組組合與資料源占位，可再微調。',
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
        spaceProfile: 'admin',
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
    label: '完整模組範例',
    description: '開啟所有範例模組（含銷售、庫存），適合體驗。',
    manifest: {
      version: 1,
      displayName: '模組範例',
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
          label: '內建範例資料',
          secretRef: 'builtin:demo',
          health: 'healthy',
        },
      ],
      ui: {
        ...baseUi,
        platform: {
          ...defaultPlatform(),
          title: '模組範例',
          subtitle: '內建範例資料，可還原後再客製',
        },
      },
      deployments: [],
      customMcpMounts: [],
      canvasMergeMode: 'merge',
    },
  },
  'dev-ide': {
    id: 'dev-ide',
    label: '開發 IDE SPACE',
    description: 'IDE 雙欄：manifest 編輯 + Agent Block 預覽。',
    manifest: {
      version: 1,
      displayName: 'Code SPACE',
      modules: {
        enabledCatalogIds: ['bridge:list', 'analytics:kpi_week'],
      },
      dataSources: [],
      ui: {
        ...baseUi,
        spaceProfile: 'ide',
        platform: {
          ...defaultPlatform(),
          title: 'Code SPACE',
          subtitle: 'MATRIX · IDE 佈局 · MCP 協作',
          placeholder: '描述要改的 manifest 或請 Agent 渲染 Block…',
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
