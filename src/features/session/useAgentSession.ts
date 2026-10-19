import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_LAYOUT_PREFERENCES } from '../../../shared/platform.ts'
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../../../shared/product.ts'
import type { ToolTraceEntry } from '../../../shared/trace.ts'
import type { Agent, Workspace } from '../../../shared/domain.ts'
import {
  addCanvasBlock,
  deleteCanvasBlock,
  fetchCanvas,
  fetchHealth,
  fetchPlatform,
  fetchSession,
  fetchWorkspaces,
  invokeMcpTool,
  patchCanvasBlock,
  saveCanvasApi,
  sendAgentChat,
  submitOpFeedback,
  type CatalogItem,
  type DevUser,
  type HealthInfo,
  type PlatformConfig,
  type SessionCapabilities,
  type SessionMember,
} from '../../mcp/client'
import { loadClientSession, saveClientSession } from '../../session/apiHeaders.ts'
import {
  LAST_SPACE_SLUG_KEY,
  restoreWorkspaceUi,
  snapshotWorkspaceUi,
} from './workspaceUiCache.ts'
import type { CanvasPage } from '../../types/ui'
import { applyUiResponse, EMPTY_CANVAS } from './applyUiResponse'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  logId?: string
  feedback?: 'helpful' | 'wrong' | 'partial'
}

const FALLBACK_PLATFORM: PlatformConfig = {
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

const TRACE_CAP = 50

export type AgentSessionOptions = {
  /** Load workspace canvas from API (SPACE pages) */
  loadCanvas?: boolean
}

const PLAIN_SUGGESTIONS = ['看這個月的請假', '本週現金流', '改成深色']

function plainSuggestions(list: string[], count: number) {
  const clean = list
    .map((text) => text.trim())
    .filter(
      (text) =>
        text &&
        !/skill|manifest|\bMCP\b|模組|read_skill|tool trace|命令盤|接上.*(資料|公司)|還缺什麼|設定資料源/i.test(
          text,
        ),
    )
  const picked = (clean.length ? clean : PLAIN_SUGGESTIONS).slice(0, count)
  return picked.length ? picked : PLAIN_SUGGESTIONS.slice(0, count)
}

export function useAgentSession(options: AgentSessionOptions = {}) {
  const { loadCanvas = false } = options
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [canvas, setCanvas] = useState<CanvasPage>(EMPTY_CANVAS)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [platform, setPlatform] = useState<PlatformConfig>(FALLBACK_PLATFORM)
  const [suggestions, setSuggestions] = useState<string[]>(PLAIN_SUGGESTIONS)
  const [busy, setBusy] = useState(false)
  const [trace, setTrace] = useState<string[]>([])
  const [traceLog, setTraceLog] = useState<ToolTraceEntry[]>([])
  const [lastProvider, setLastProvider] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [lastRunId, setLastRunId] = useState<string | null>(null)
  const [opsRefreshKey, setOpsRefreshKey] = useState(0)
  const [clientSession, setClientSession] = useState(loadClientSession)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [canvasMergeMode, setCanvasMergeMode] = useState<'merge' | 'replace'>('merge')
  const [capabilities, setCapabilities] = useState<SessionCapabilities>({
    role: 'member',
    canManageManifest: true,
    canInvite: false,
    canEditCanvas: true,
  })
  const [workspaceMembers, setWorkspaceMembers] = useState<SessionMember[]>([])
  const [devUsers, setDevUsers] = useState<DevUser[]>([])
  const [flash, setFlash] = useState<{ text: string; variant: 'error' | 'ok' } | null>(null)
  const busyRef = useRef(false)
  const canvasRevisionRef = useRef(1)
  const mergeModeRef = useRef<'merge' | 'replace'>('merge')
  const messagesRef = useRef(messages)
  const traceRef = useRef(trace)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    traceRef.current = trace
  }, [trace])

  const persistCanvas = useCallback(async (page: CanvasPage) => {
    try {
      const { canvas: saved } = await saveCanvasApi(
        {
          ...page,
          revision: canvasRevisionRef.current,
        },
        canvasRevisionRef.current,
      )
      canvasRevisionRef.current = saved.revision
      if (loadCanvas) setCanvas(saved)
    } catch {
      /* keep local */
    }
  }, [loadCanvas])

  const applyUi = useCallback(
    (prev: CanvasPage, ui: Parameters<typeof applyUiResponse>[1]) =>
      applyUiResponse(prev, ui, mergeModeRef.current),
    [],
  )

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', platform.theme === 'dark')
  }, [platform.theme])

  const refreshSuggestions = useCallback(async () => {
    if (!platform.suggestionsEnabled) {
      setSuggestions([])
      return
    }
    try {
      const platformData = await fetchPlatform()
      setSuggestions(plainSuggestions(platformData.suggestions, platform.suggestionCount))
    } catch {
      /* 建議句不打模型，失敗就沿用上一組 */
    }
  }, [platform.suggestionsEnabled, platform.suggestionCount])

  const refreshBackend = useCallback(async () => {
    try {
      const [healthData, platformData, sessionData, canvasData, wsData] = await Promise.all([
        fetchHealth(),
        fetchPlatform(),
        fetchSession(),
        loadCanvas ? fetchCanvas().catch(() => null) : Promise.resolve(null),
        fetchWorkspaces().catch(() => ({ workspaces: [] as Workspace[] })),
      ])
      setHealth(healthData)
      setPlatform(platformData.platform)
      setAgents(sessionData.agents)
      setCapabilities(sessionData.capabilities)
      setWorkspaceMembers(sessionData.workspaceMembers)
      setDevUsers(sessionData.devUsers)
      setWorkspaces(wsData.workspaces)
      if (canvasData) {
        setCanvas(canvasData.canvas)
        canvasRevisionRef.current = canvasData.canvas.revision ?? 1
        mergeModeRef.current = canvasData.mergeMode
        setCanvasMergeMode(canvasData.mergeMode)
      }
      setClientSession(sessionData.session)
      saveClientSession(sessionData.session)
      setOffline(false)
      return true
    } catch {
      setOffline(true)
      return false
    }
  }, [loadCanvas])

  useEffect(() => {
    void refreshBackend()
  }, [refreshBackend])

  useEffect(() => {
    if (!loadCanvas) return
    void refreshBackend()
  }, [loadCanvas, refreshBackend])

  useEffect(() => {
    if (busy || offline) return
    const timer = window.setTimeout(() => {
      void refreshSuggestions()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [busy, offline, refreshSuggestions])

  useEffect(() => {
    if (!offline) return
    const timer = window.setInterval(() => {
      void refreshBackend()
    }, 4000)
    return () => window.clearInterval(timer)
  }, [offline, refreshBackend])

  const appendTrace = useCallback((entries: ToolTraceEntry[]) => {
    if (!entries.length) return
    setTraceLog((prev) => [...prev, ...entries].slice(-TRACE_CAP))
  }, [])

  const runMcpInvoke = useCallback(
    async (tool: string, payload?: Record<string, unknown>) => {
      setBusy(true)
      try {
        const result = await invokeMcpTool(tool, payload)
        if (result.ui) {
          setCanvas((prev) => {
            const next = applyUi(prev, result.ui)
            void persistCanvas(next)
            return loadCanvas ? next : prev
          })
        }
        if (result.platform) setPlatform(result.platform)
        appendTrace(result.trace ?? [])
        if (result.runId) setLastRunId(result.runId)
        setOpsRefreshKey((k) => k + 1)
      } finally {
        setBusy(false)
      }
    },
    [appendTrace, applyUi, persistCanvas, loadCanvas],
  )

  const runCatalogItem = useCallback(
    (item: CatalogItem) => {
      void runMcpInvoke(item.tool, item.defaultPayload)
    },
    [runMcpInvoke],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busyRef.current) return
      setBusy(true)
      setTrace([`已送出：${trimmed}`])
      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(nextMessages)
      try {
        const result = await sendAgentChat(
          nextMessages,
          (line) => setTrace((prev) => [...prev, line]),
          clientSession.agentId,
        )
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.assistantMessage,
            logId: result.replyLogId,
          },
        ])
        setOpsRefreshKey((k) => k + 1)
        setLastProvider(result.provider)
        if (result.ui) {
          setCanvas((prev) => {
            const base = result.replaceCanvas ? { ...EMPTY_CANVAS } : prev
            const next = applyUi(base, result.ui)
            void persistCanvas(next)
            return loadCanvas ? next : prev
          })
        }
        if (result.platform) setPlatform(result.platform)
        if (result.suggestions?.length) {
          setSuggestions(plainSuggestions(result.suggestions, platform.suggestionCount))
        }
        appendTrace(result.trace ?? [])
        if (result.runId) setLastRunId(result.runId)
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err instanceof Error ? err.message : '連線失敗' },
        ])
      } finally {
        setBusy(false)
      }
    },
    [messages, appendTrace, clientSession.agentId, applyUi, persistCanvas, loadCanvas, platform.suggestionCount],
  )

  const rateAssistantReply = useCallback(
    async (logId: string, rating: 'helpful' | 'wrong' | 'partial', comment?: string) => {
      await submitOpFeedback({ targetEntryId: logId, rating, comment })
      setMessages((prev) =>
        prev.map((m) => (m.logId === logId ? { ...m, feedback: rating } : m)),
      )
      setOpsRefreshKey((k) => k + 1)
    },
    [],
  )

  const selectAgent = useCallback((agentId: string) => {
    const next = { ...loadClientSession(), agentId }
    saveClientSession(next)
    setClientSession(next)
    void refreshBackend()
  }, [refreshBackend])

  const switchWorkspace = useCallback(
    (workspaceId: string, slug?: string) => {
      void (async () => {
        const prevId = loadClientSession().workspaceId
        if (prevId !== workspaceId) {
          snapshotWorkspaceUi(prevId, {
            messages: messagesRef.current,
            composerDraft: '',
            trace: traceRef.current,
          })
          if (loadCanvas) {
            setCanvas(EMPTY_CANVAS)
            canvasRevisionRef.current = 1
          }
        }
        const restored = restoreWorkspaceUi(workspaceId)
        const next = { ...loadClientSession(), workspaceId, agentId: '' }
        saveClientSession(next)
        setClientSession(next)
        if (slug) localStorage.setItem(LAST_SPACE_SLUG_KEY, slug)
        setMessages(restored?.messages ?? [])
        setTrace(restored?.trace ?? [])
        await refreshBackend()
      })()
    },
    [refreshBackend, loadCanvas],
  )

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId)
      switchWorkspace(workspaceId, ws?.slug)
    },
    [switchWorkspace, workspaces],
  )

  const selectUser = useCallback(
    (userId: string) => {
      const next = { ...loadClientSession(), userId }
      saveClientSession(next)
      setClientSession(next)
      void refreshBackend()
    },
    [refreshBackend],
  )

  const showFlash = useCallback((text: string, variant: 'error' | 'ok' = 'error') => {
    setFlash({ text, variant })
  }, [])

  const clearFlash = useCallback(() => setFlash(null), [])

  const updateBlockProps = useCallback(
    async (blockId: string, props: Record<string, unknown>) => {
      try {
        const { canvas: saved } = await patchCanvasBlock(blockId, props)
        canvasRevisionRef.current = saved.revision
        setCanvas(saved)
        setOpsRefreshKey((k) => k + 1)
      } catch (err) {
        showFlash(err instanceof Error ? err.message : '無法更新 Block')
      }
    },
    [showFlash],
  )

  const addBlockFromTemplate = useCallback(
    async (templateId: string) => {
      try {
        const { canvas: saved, blockId } = await addCanvasBlock(templateId)
        canvasRevisionRef.current = saved.revision
        setCanvas(saved)
        setFocusedBlockId(blockId)
        setOpsRefreshKey((k) => k + 1)
      } catch (err) {
        showFlash(err instanceof Error ? err.message : '無法新增 Block')
      }
    },
    [showFlash],
  )

  const removeBlock = useCallback(
    async (blockId: string) => {
      try {
        const { canvas: saved } = await deleteCanvasBlock(blockId)
        canvasRevisionRef.current = saved.revision
        setCanvas(saved)
        setOpsRefreshKey((k) => k + 1)
      } catch (err) {
        showFlash(err instanceof Error ? err.message : '無法刪除 Block')
      }
    },
    [showFlash],
  )

  const focusAdjacentBlock = useCallback(
    (direction: 1 | -1) => {
      if (canvas.blocks.length === 0) return
      const ids = canvas.blocks.map((b) => b.blockId)
      const idx = focusedBlockId ? ids.indexOf(focusedBlockId) : -1
      const next = ids[(idx + direction + ids.length) % ids.length]
      setFocusedBlockId(next)
    },
    [canvas.blocks, focusedBlockId],
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
    traceLog,
    offline,
    focusedBlockId,
    setFocusedBlockId,
    focusAdjacentBlock,
    sendMessage,
    runMcpInvoke,
    runCatalogItem,
    agents,
    lastRunId,
    clientSession,
    selectAgent,
    refreshBackend,
    rateAssistantReply,
    opsRefreshKey,
    workspaces,
    selectWorkspace,
    canvasMergeMode,
    updateBlockProps,
    addBlockFromTemplate,
    removeBlock,
    capabilities,
    workspaceMembers,
    devUsers,
    selectUser,
    flash,
    showFlash,
    clearFlash,
    switchWorkspace,
  }
}
