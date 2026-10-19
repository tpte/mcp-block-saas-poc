import type { McpUiResponse, UiBlock } from '../types/ui'

const leaveTableBlock = (): UiBlock => ({
  type: 'block',
  component: 'ShadcnDataTableBlock',
  blockId: 'hr-leave-table-202610',
  props: {
    title: '2026 年 10 月 員工請假明細',
    columns: [
      { key: 'name', label: '姓名' },
      { key: 'days', label: '請假天數' },
      { key: 'status', label: '狀態' },
    ],
    data: [
      { id: 1, name: '張小明', days: 5, status: 'warning' },
      { id: 2, name: '李大華', days: 1, status: 'normal' },
      { id: 3, name: '王美玲', days: 4, status: 'warning' },
    ],
    actions: [
      {
        label: '核准全選',
        mcpTool: 'hr:approve_all',
        payload: { month: '2026-10' },
      },
    ],
  },
})

export async function invokeMcpTool(
  tool: string,
  _payload?: Record<string, unknown>,
): Promise<McpUiResponse> {
  await delay(400)

  if (tool === 'hr:approve_all') {
    return {
      action: 'UPDATE_DATA',
      targetBlockId: 'hr-leave-table-202610',
      patch: {
        data: [
          { id: 1, name: '張小明', days: 5, status: 'approved' },
          { id: 2, name: '李大華', days: 1, status: 'approved' },
          { id: 3, name: '王美玲', days: 4, status: 'approved' },
        ],
      },
    }
  }

  if (tool === 'hr:get_leave') {
    return { action: 'RENDER', ui: leaveTableBlock() }
  }

  if (tool === 'sales:pipeline') {
    return {
      action: 'RENDER',
      ui: {
        type: 'block',
        component: 'ShadcnStatsCardBlock',
        blockId: 'sales-pipeline-1',
        props: {
          label: '本週業務 Pipeline',
          value: 'NT$ 8.6M',
          trend: '3 件待簽約',
          description: 'MCP sales:pipeline（mock）',
        },
      },
    }
  }

  if (tool === 'finance:get_cashflow') {
    return {
      action: 'RENDER',
      ui: {
        layout: 'stack',
        blocks: [
          {
            type: 'block',
            component: 'ShadcnStatsCardBlock',
            blockId: 'finance-cash-1',
            props: {
              label: '本月淨現金流',
              value: 'NT$ 1,240,000',
              trend: '+12.4%',
              description: 'MCP finance:get_cashflow',
            },
          },
          {
            type: 'block',
            component: 'ShadcnDataTableBlock',
            blockId: 'finance-table-1',
            props: {
              title: '近 7 日收支摘要',
              columns: [
                { key: 'date', label: '日期' },
                { key: 'in', label: '收入' },
                { key: 'out', label: '支出' },
              ],
              data: [
                { id: 1, date: '10/14', in: 320000, out: 180000 },
                { id: 2, date: '10/15', in: 210000, out: 95000 },
                { id: 3, date: '10/16', in: 450000, out: 120000 },
              ],
            },
          },
        ],
      },
    }
  }

  return {
    action: 'RENDER',
    ui: leaveTableBlock(),
  }
}

export async function runAgentIntent(message: string): Promise<McpUiResponse> {
  await delay(600)
  const text = message.toLowerCase()

  if (text.includes('財務') || text.includes('cashflow') || text.includes('現金')) {
    return invokeMcpTool('finance:get_cashflow')
  }

  if (text.includes('請假') || text.includes('員工') || text.includes('hr')) {
    return {
      action: 'RENDER',
      ui: leaveTableBlock(),
    }
  }

  return {
    action: 'RENDER',
    ui: {
      layout: 'stack',
      blocks: [
        {
          type: 'block',
          component: 'ShadcnFormBlock',
          blockId: 'agent-hint-form',
          props: {
            title: 'Agent 提示',
            description:
              '試試：「幫我看這個月的員工請假狀況」或「顯示本月財務現金流」',
          },
        },
      ],
    },
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
