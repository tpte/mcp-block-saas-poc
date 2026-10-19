import { useCallback, useEffect, useState } from 'react'
import {
  fetchHealth,
  fetchPlatform,
  invokeMcpTool,
  sendAgentChat,
  type HealthInfo,
  type PlatformConfig,
} from '../../mcp/client'
import type { CanvasPage } from '../../types/ui'
import { applyUiResponse, EMPTY_CANVAS } from './applyUiResponse'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const FALLBACK_PLATFORM: PlatformConfig = {
  theme: 'light',
  composerPosition: 'bottom',
  composerWidth: 'narrow',
  placeholder: '跟 Agent 說你想看什麼…',
  showHistory: true,
  suggestionsEnabled: true,
  suggestionCount: 3,
  title: 'Super MCP',
  subtitle: '任何 MCP，即時渲染成畫面',
  canvasMaxWidth: 'xl',
  density: 'comfortable',
  showModelBadge: true,
}

export function useAgentSession() {
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [canvas, setCanvas] = useState<CanvasPage>(EMPTY_CANVAS)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [platform, setPlatform] = useState<PlatformConfig>(FALLBACK_PLATFORM)
  const [suggestions, setSuggestions] = useState<string[]>([
    '幫我看這個月的員工請假狀況',
    '顯示本月財務現金流',
    '改成深色模式',
  ])
  const [busy, setBusy] = useState(false)
  const [trace, setTrace] = useState<string[]>([])
  const [lastProvider, setLastProvider] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', platform.theme === 'dark')
  }, [platform.theme])

  useEffect(() => {
    void fetchHealth()
      .then(setHealth)
      .catch(() => setOffline(true))
    void fetchPlatform()
      .then((data) => {
        setPlatform(data.platform)
        setSuggestions(data.suggestions)
      })
      .catch(() => setOffline(true))
  }, [])

  const runMcpInvoke = useCallback(async (tool: string, payload?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const result = await invokeMcpTool(tool, payload)
      if (result.ui) setCanvas((prev) => applyUiResponse(prev, result.ui))
      if (result.platform) setPlatform(result.platform)
      if (result.suggestions) setSuggestions(result.suggestions)
    } finally {
      setBusy(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setBusy(true)
      setTrace([`已送出：${trimmed}`])
      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(nextMessages)
      try {
        const result = await sendAgentChat(nextMessages, (line) => setTrace((prev) => [...prev, line]))
        setMessages((prev) => [...prev, { role: 'assistant', content: result.assistantMessage }])
        setLastProvider(result.provider)
        if (result.ui) setCanvas((prev) => applyUiResponse(prev, result.ui))
        if (result.platform) setPlatform(result.platform)
        if (result.suggestions) setSuggestions(result.suggestions)
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

  return {
    health,
    canvas,
    messages,
    platform,
    suggestions,
    busy,
    lastProvider,
    trace,
    offline,
    sendMessage,
    runMcpInvoke,
  }
}
