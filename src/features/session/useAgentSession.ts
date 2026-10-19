import { useCallback, useEffect, useState } from 'react'
import {
  fetchDashboard,
  fetchHealth,
  invokeMcpTool,
  sendAgentChat,
  type HealthInfo,
} from '../../mcp/client'
import type { UiBlock } from '../../types/ui'
import { applyUiResponse } from './applyUiResponse'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const MODULES = [
  {
    id: 'hr',
    label: '員工 HR',
    tool: 'hr:get_leave',
    prompts: ['幫我看這個月的員工請假狀況', '有哪些請假超過 3 天？'],
  },
  {
    id: 'finance',
    label: '財務 Finance',
    tool: 'finance:get_cashflow',
    prompts: ['顯示本月財務現金流', '列出待處理發票'],
  },
  {
    id: 'sales',
    label: '業務 Sales',
    tool: 'sales:pipeline',
    prompts: ['給我看業務 pipeline 看板', '本週有哪些待簽約？'],
  },
  {
    id: 'inventory',
    label: '進銷存 Inventory',
    tool: 'inventory:stock_alerts',
    prompts: ['哪些 SKU 庫存偏低？', '顯示進銷存警示'],
  },
  {
    id: 'support',
    label: '客服 Support',
    tool: 'support:open_tickets',
    prompts: ['列出未結案客服工單', '今天客服處理紀錄'],
  },
  {
    id: 'analytics',
    label: '報表 Analytics',
    tool: 'analytics:kpi_week',
    prompts: ['本週 KPI 與轉換率', '渠道流量占比'],
  },
] as const

export function useAgentSession() {
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [blocks, setBlocks] = useState<UiBlock[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [activeModule, setActiveModule] = useState<string>('home')
  const [lastProvider, setLastProvider] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const h = await fetchHealth()
        setHealth(h)
        const dash = await fetchDashboard()
        setBlocks(applyUiResponse([], dash))
      } catch {
        setLog((prev) => ['API 連線失敗，請確認 npm run dev:all', ...prev])
      }
    })()
  }, [])

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 10))
  }, [])

  const loadDashboard = useCallback(async () => {
    setBusy(true)
    try {
      const dash = await fetchDashboard()
      setBlocks(applyUiResponse([], dash))
      pushLog('UI ← dashboard')
    } finally {
      setBusy(false)
    }
  }, [pushLog])

  const runMcpInvoke = useCallback(
    async (tool: string, payload?: Record<string, unknown>) => {
      setBusy(true)
      pushLog(`MCP → ${tool}`)
      try {
        const ui = await invokeMcpTool(tool, payload)
        setBlocks((prev) => applyUiResponse(prev, ui))
        pushLog(`UI ← ${ui.action}`)
      } catch (err) {
        pushLog(err instanceof Error ? err.message : 'invoke failed')
      } finally {
        setBusy(false)
      }
    },
    [pushLog],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setBusy(true)
      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(nextMessages)
      pushLog(`User ← ${trimmed}`)
      try {
        const result = await sendAgentChat(nextMessages)
        setMessages((prev) => [...prev, { role: 'assistant', content: result.assistantMessage }])
        setLastProvider(result.provider)
        if (result.ui) setBlocks((prev) => applyUiResponse(prev, result.ui))
        pushLog(`Agent (${result.mode}) → ${result.ui?.action ?? 'no-ui'}`)
      } catch (err) {
        pushLog(err instanceof Error ? err.message : 'chat failed')
      } finally {
        setBusy(false)
      }
    },
    [messages, pushLog],
  )

  return {
    health,
    blocks,
    messages,
    log,
    busy,
    activeModule,
    setActiveModule,
    lastProvider,
    sendMessage,
    runMcpInvoke,
    loadDashboard,
  }
}
