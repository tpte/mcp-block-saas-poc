import { useCallback, useEffect, useState } from 'react'
import { fetchHealth, invokeMcpTool, sendAgentChat, type HealthInfo } from '../../mcp/client'
import type { CanvasPage } from '../../types/ui'
import { applyUiResponse, EMPTY_CANVAS } from './applyUiResponse'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const SUGGESTIONS = [
  '幫我看這個月的員工請假狀況',
  '顯示本月財務現金流',
  '給我看業務 pipeline 看板',
] as const

export function useAgentSession() {
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [canvas, setCanvas] = useState<CanvasPage>(EMPTY_CANVAS)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [lastProvider, setLastProvider] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    void fetchHealth()
      .then(setHealth)
      .catch(() => setOffline(true))
  }, [])

  const runMcpInvoke = useCallback(async (tool: string, payload?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const ui = await invokeMcpTool(tool, payload)
      setCanvas((prev) => applyUiResponse(prev, ui))
    } finally {
      setBusy(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setBusy(true)
      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(nextMessages)
      try {
        const result = await sendAgentChat(nextMessages)
        setMessages((prev) => [...prev, { role: 'assistant', content: result.assistantMessage }])
        setLastProvider(result.provider)
        if (result.ui) setCanvas((prev) => applyUiResponse(prev, result.ui))
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err instanceof Error ? err.message : '連線失敗' },
        ])
      } finally {
        setBusy(false)
      }
    },
    [busy, messages],
  )

  return { health, canvas, messages, busy, lastProvider, offline, sendMessage, runMcpInvoke }
}
