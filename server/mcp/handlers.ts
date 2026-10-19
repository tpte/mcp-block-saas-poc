import type { McpUiResponse, UiBlock } from '../../shared/ui.ts'
import {
  approveAllLeave,
  assignFirstTicket,
  invoices,
  leaveRows,
  reorderCriticalStock,
  stockRows,
  tickets,
} from './store.ts'

const leaveTable = (): UiBlock => ({
  type: 'block',
  component: 'ShadcnDataTableBlock',
  blockId: 'hr-leave-table-202610',
  props: {
    title: '2026 年 10 月員工請假明細',
    columns: [
      { key: 'name', label: '姓名' },
      { key: 'dept', label: '部門' },
      { key: 'days', label: '請假天數' },
      { key: 'status', label: '狀態' },
    ],
    data: [...leaveRows],
    actions: [{ label: '核准全選', mcpTool: 'hr:approve_all', payload: { month: '2026-10' } }],
  },
})

export const MCP_TOOL_NAMES = [
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
] as const

export type McpToolName = (typeof MCP_TOOL_NAMES)[number]

export function invokeMcpTool(tool: string, _payload?: Record<string, unknown>): McpUiResponse {
  switch (tool) {
    case 'hr:approve_all':
      approveAllLeave()
      return {
        action: 'UPDATE_DATA',
        targetBlockId: 'hr-leave-table-202610',
        patch: { data: [...leaveRows] },
      }
    case 'hr:get_leave':
      return {
        action: 'RENDER',
        ui: {
          layout: 'stack',
          blocks: [
            {
              type: 'block',
              component: 'ShadcnAlertBlock',
              blockId: 'hr-alert-1',
              props: {
                variant: 'warning',
                title: 'HR 提醒',
                description: '有 2 位員工請假超過 3 天，建議優先審核。',
              },
            },
            leaveTable(),
          ],
        },
      }
    case 'finance:get_cashflow':
      return {
        action: 'RENDER',
        ui: {
          layout: 'stack',
          blocks: [
            {
              type: 'block',
              component: 'ShadcnMetricGridBlock',
              blockId: 'finance-metrics-1',
              props: {
                metrics: [
                  { label: '本月淨現金流', value: 'NT$ 1,240,000', trend: '+12.4%' },
                  { label: '應收帳款', value: 'NT$ 3.8M', trend: '-4.1%' },
                  { label: '待付發票', value: '18 張', trend: '3 張逾期' },
                ],
              },
            },
            {
              type: 'block',
              component: 'ShadcnChartBlock',
              blockId: 'finance-chart-1',
              props: {
                title: '近 7 日收支趨勢',
                chartType: 'line',
                series: [
                  { label: '10/14', value: 140000 },
                  { label: '10/15', value: 115000 },
                  { label: '10/16', value: 330000 },
                  { label: '10/17', value: 98000 },
                  { label: '10/18', value: 210000 },
                ],
              },
            },
          ],
        },
      }
    case 'finance:list_invoices':
      return {
        action: 'RENDER',
        ui: {
          type: 'block',
          component: 'ShadcnDataTableBlock',
          blockId: 'finance-invoices-1',
          props: {
            title: '待處理發票',
            columns: [
              { key: 'vendor', label: '廠商' },
              { key: 'amount', label: '金額' },
              { key: 'status', label: '狀態' },
            ],
            data: [...invoices],
          },
        },
      }
    case 'sales:pipeline':
      return {
        action: 'RENDER',
        ui: {
          layout: 'stack',
          blocks: [
            {
              type: 'block',
              component: 'ShadcnStatsCardBlock',
              blockId: 'sales-pipeline-1',
              props: {
                label: '本週 Pipeline',
                value: 'NT$ 8.6M',
                trend: '3 件待簽約',
                description: 'MCP sales:pipeline',
              },
            },
            {
              type: 'block',
              component: 'ShadcnKanbanBlock',
              blockId: 'sales-kanban-1',
              props: {
                title: '業務看板',
                kanban: [
                  {
                    id: 'lead',
                    title: 'Lead',
                    cards: [
                      { id: 'l1', title: '宏達物流', meta: 'NT$ 1.2M' },
                      { id: 'l2', title: '星際零售', meta: 'NT$ 680K' },
                    ],
                  },
                  {
                    id: 'negotiation',
                    title: 'Negotiation',
                    cards: [{ id: 'n1', title: '綠能科技', meta: 'NT$ 2.4M' }],
                  },
                  {
                    id: 'won',
                    title: 'Won',
                    cards: [{ id: 'w1', title: '極光製造', meta: 'NT$ 960K' }],
                  },
                ],
              },
            },
          ],
        },
      }
    case 'sales:create_lead':
      return {
        action: 'RENDER',
        ui: {
          type: 'block',
          component: 'ShadcnAlertBlock',
          blockId: 'sales-lead-created',
          props: {
            variant: 'default',
            title: '已建立新 Lead',
            description: '「海灣醫療」已加入 Pipeline，負責人：Alan。',
          },
        },
      }
    case 'inventory:stock_alerts':
      return {
        action: 'RENDER',
        ui: {
          layout: 'stack',
          blocks: [
            {
              type: 'block',
              component: 'ShadcnAlertBlock',
              blockId: 'inv-alert-1',
              props: {
                variant: 'destructive',
                title: '庫存警示',
                description: 'SKU-022 電源供應器低於安全庫存（5 / 20）。',
              },
            },
            {
              type: 'block',
              component: 'ShadcnDataTableBlock',
              blockId: 'inv-table-1',
              props: {
                title: '庫存快照',
                columns: [
                  { key: 'sku', label: 'SKU' },
                  { key: 'name', label: '品名' },
                  { key: 'qty', label: '數量' },
                  { key: 'status', label: '狀態' },
                ],
                data: [...stockRows],
                actions: [{ label: '補貨 SKU-022', mcpTool: 'inventory:reorder' }],
              },
            },
          ],
        },
      }
    case 'inventory:reorder':
      reorderCriticalStock()
      return {
        action: 'UPDATE_DATA',
        targetBlockId: 'inv-table-1',
        patch: { data: [...stockRows] },
      }
    case 'support:open_tickets':
      return {
        action: 'RENDER',
        ui: {
          type: 'block',
          component: 'ShadcnTabsBlock',
          blockId: 'support-tabs-1',
          props: {
            tabs: [
              {
                id: 'open',
                label: '未結案',
                blocks: [
                  {
                    type: 'block',
                    component: 'ShadcnDataTableBlock',
                    blockId: 'support-table-open',
                    props: {
                      title: '未結案工單',
                      columns: [
                        { key: 'customer', label: '客戶' },
                        { key: 'subject', label: '主題' },
                        { key: 'priority', label: '優先級' },
                        { key: 'status', label: '狀態' },
                      ],
                      data: tickets.filter((t) => t.status !== 'closed'),
                      actions: [{ label: '指派首位', mcpTool: 'support:assign' }],
                    },
                  },
                ],
              },
              {
                id: 'timeline',
                label: '處理紀錄',
                blocks: [
                  {
                    type: 'block',
                    component: 'ShadcnTimelineBlock',
                    blockId: 'support-timeline-1',
                    props: {
                      title: '今日處理紀錄',
                      items: [
                        { id: '1', time: '09:12', title: '宏達物流回報 API 延遲', detail: '已升級為高優先' },
                        { id: '2', time: '10:45', title: '星際零售附件已補', detail: '等待客戶確認' },
                        { id: '3', time: '11:20', title: '綠能科技權限申請', detail: '待主管核准' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      }
    case 'support:assign':
      assignFirstTicket()
      return {
        action: 'UPDATE_DATA',
        targetBlockId: 'support-table-open',
        patch: { data: tickets.filter((t) => t.status !== 'closed') },
      }
    case 'analytics:kpi_week':
      return {
        action: 'RENDER',
        ui: {
          layout: 'stack',
          blocks: [
            {
              type: 'block',
              component: 'ShadcnMetricGridBlock',
              blockId: 'analytics-kpi-1',
              props: {
                metrics: [
                  { label: '週活躍使用者', value: '1,284', trend: '+6.2%' },
                  { label: '轉換率', value: '3.8%', trend: '+0.4pp' },
                  { label: '客訴率', value: '0.9%', trend: '-0.2pp' },
                ],
              },
            },
            {
              type: 'block',
              component: 'ShadcnChartBlock',
              blockId: 'analytics-chart-1',
              props: {
                title: '渠道流量占比',
                chartType: 'bar',
                series: [
                  { label: 'Direct', value: 42 },
                  { label: 'Search', value: 28 },
                  { label: 'Partner', value: 18 },
                  { label: 'Social', value: 12 },
                ],
              },
            },
          ],
        },
      }
    case 'analytics:channel_mix':
      return invokeMcpTool('analytics:kpi_week')
    default:
      return {
        action: 'RENDER',
        ui: {
          type: 'block',
          component: 'ShadcnFormBlock',
          blockId: 'unknown-tool',
          props: {
            title: '未知 MCP Tool',
            description: `未支援的 tool：${tool}`,
          },
        },
      }
  }
}

export function runKeywordAgent(message: string): McpUiResponse {
  const text = message.toLowerCase()
  if (text.includes('財務') || text.includes('cashflow') || text.includes('現金') || text.includes('發票')) {
    return text.includes('發票') ? invokeMcpTool('finance:list_invoices') : invokeMcpTool('finance:get_cashflow')
  }
  if (text.includes('業務') || text.includes('pipeline') || text.includes('銷售')) {
    return invokeMcpTool('sales:pipeline')
  }
  if (text.includes('庫存') || text.includes('進銷存') || text.includes('inventory')) {
    return invokeMcpTool('inventory:stock_alerts')
  }
  if (text.includes('客服') || text.includes('工單') || text.includes('support')) {
    return invokeMcpTool('support:open_tickets')
  }
  if (text.includes('報表') || text.includes('analytics') || text.includes('kpi')) {
    return invokeMcpTool('analytics:kpi_week')
  }
  if (text.includes('請假') || text.includes('員工') || text.includes('hr')) {
    return invokeMcpTool('hr:get_leave')
  }
  return {
    action: 'RENDER',
    ui: dashboardHome(),
  }
}

export function dashboardHome(): { layout: 'stack'; blocks: UiBlock[] } {
  return {
    layout: 'stack',
    blocks: [
      {
        type: 'block',
        component: 'ShadcnMetricGridBlock',
        blockId: 'home-metrics',
        props: {
          metrics: [
            { label: '今日待辦', value: '12', trend: '4 項高優先' },
            { label: 'MRR', value: 'NT$ 2.1M', trend: '+3.1%' },
            { label: 'SLA', value: '98.2%', trend: '本週' },
          ],
        },
      },
      {
        type: 'block',
        component: 'ShadcnFormBlock',
        blockId: 'home-hint',
        props: {
          title: '開始使用',
          description: '在左側選模組，或用自然語言請 Agent 組出專屬畫面。',
        },
      },
    ],
  }
}
