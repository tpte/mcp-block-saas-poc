import type { PlatformConfig } from '../../shared/platform.ts'

export type { PlatformConfig }

const defaults = (): PlatformConfig => ({
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
})

let config = defaults()
let lastTopic = 'home'

export function getPlatform(): PlatformConfig {
  return { ...config }
}

export function applyPlatformPatch(patch: Partial<PlatformConfig>) {
  const next = { ...config, ...sanitize(patch) }
  next.suggestionCount = clampCount(next.suggestionCount)
  config = next
  return getPlatform()
}

export function noteTopic(topic: string) {
  lastTopic = topic
}

export function foldText(text: string) {
  return text
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toLowerCase()
}

export function looksLikeData(text: string) {
  return /請假|員工|財務|現金|發票|業務|pipeline|銷售|庫存|進銷存|客服|工單|報表|kpi|圖表|渠道|外部|掛載|bridge|筆記|notes/i.test(foldText(text))
}

export function interpretPlatform(raw: string): Partial<PlatformConfig> | null {
  const text = foldText(raw)
  const patch: Partial<PlatformConfig> = {}
  if (/深色|暗色|dark/i.test(text)) patch.theme = 'dark'
  if (/淺色|亮色|light mode|白色模式/i.test(text)) patch.theme = 'light'
  if (/對話(框|匡).*(上|頂)|輸入框.*(上|頂)|composer.*top/i.test(text)) patch.composerPosition = 'top'
  if (/對話(框|匡).*(下|底)|輸入框.*(下|底)/i.test(text)) patch.composerPosition = 'bottom'
  if (/對話(框|匡).*(寬|加寬)|輸入框.*(寬)/.test(text)) patch.composerWidth = 'wide'
  if (/對話(框|匡).*(窄)/.test(text)) patch.composerWidth = 'narrow'
  if (/預測.*(關|不要|隱藏)|關掉下一句|不要提示/.test(text)) patch.suggestionsEnabled = false
  if (/打開預測|顯示預測|開啟下一句/.test(text)) patch.suggestionsEnabled = true
  const count = text.match(/(?:預測|下一句|prompt).{0,8}?(\d+)\s*個?/i)
  if (count) patch.suggestionCount = Number(count[1])
  if (/畫布.*(全寬|放滿)|排版.*全寬/.test(text)) patch.canvasMaxWidth = 'full'
  if (/畫布.*(收斂|變窄)|排版.*置中/.test(text)) patch.canvasMaxWidth = 'md'
  if (/緊湊|密度.*高/.test(text)) patch.density = 'compact'
  if (/寬鬆|舒適/.test(text)) patch.density = 'comfortable'
  const title = text.match(/(?:標題|平台名|改名)(?:改成|為|成)\s*[「"]?([^」"\n]{1,24})/)
  if (title) patch.title = title[1].trim()
  const placeholder = text.match(/(?:提示文字|placeholder)(?:改成|為)\s*[「"]?([^」"\n]{1,40})/i)
  if (placeholder) patch.placeholder = placeholder[1].trim()
  if (/隱藏模型|不要顯示模型/.test(text)) patch.showModelBadge = false
  if (/顯示模型/.test(text)) patch.showModelBadge = true
  if (/隱藏對話紀錄|不要顯示對話/.test(text)) patch.showHistory = false
  if (/顯示對話紀錄/.test(text)) patch.showHistory = true
  return Object.keys(patch).length ? patch : null
}

export function predictPrompts(): string[] {
  if (!config.suggestionsEnabled) return []
  const pools: Record<string, string[]> = {
    home: ['幫我看這個月的員工請假狀況', '顯示本月財務現金流', '改成深色模式', '把對話框移到上方', '預測改成 5 個', '畫布改成全寬'],
    hr: ['核准超過 3 天的請假', '顯示本月財務現金流', '改成深色模式', '預測改成 5 個', '把對話框加寬', '畫布改成全寬'],
    finance: ['列出待付發票', '給我看業務 pipeline 看板', '把對話框加寬', '畫布改成全寬', '改成深色模式', '關掉預測提示'],
    sales: ['本週有哪些待簽約？', '哪些 SKU 庫存偏低？', '標題改成北極星工作台', '關掉預測提示', '改成淺色模式', '對話框移到底部'],
    inventory: ['補貨危急 SKU', '列出未結案客服工單', '改成淺色模式', '排版置中', '顯示本月財務現金流', '預測改成 5 個'],
    support: ['今天客服處理紀錄', '本週 KPI 與轉換率', '對話框移到底部', '顯示模型', '改成深色模式', '畫布改成全寬'],
    analytics: ['渠道流量占比', '顯示本月財務現金流', '打開預測', '提示文字改成問我任何資料', '把對話框移到上方', '改成深色模式'],
    bridge: ['列出已掛載的外部 MCP', '讀取 notes 記事', '顯示本月財務現金流', '改成深色模式', '預測改成 5 個', '把對話框移到上方'],
  }
  const list = pools[lastTopic] ?? pools.home
  return list.slice(0, config.suggestionCount)
}

export function topicFromMessage(text: string) {
  text = foldText(text)
  if (/請假|員工|\bhr\b/i.test(text)) return 'hr'
  if (/財務|現金|發票|cashflow/i.test(text)) return 'finance'
  if (/業務|pipeline|銷售/i.test(text)) return 'sales'
  if (/庫存|進銷存|inventory/i.test(text)) return 'inventory'
  if (/客服|工單|support/i.test(text)) return 'support'
  if (/報表|analytics|kpi|渠道/i.test(text)) return 'analytics'
  if (/外部|掛載|bridge|筆記|notes/i.test(text)) return 'bridge'
  return null
}

export function topicFromTool(tool: string) {
  if (tool.startsWith('hr:')) return 'hr'
  if (tool.startsWith('finance:')) return 'finance'
  if (tool.startsWith('sales:')) return 'sales'
  if (tool.startsWith('inventory:')) return 'inventory'
  if (tool.startsWith('support:')) return 'support'
  if (tool.startsWith('analytics:')) return 'analytics'
  if (tool.startsWith('bridge:') || tool.startsWith('notes:')) return 'bridge'
  return lastTopic
}

function sanitize(patch: Partial<PlatformConfig>): Partial<PlatformConfig> {
  const next: Partial<PlatformConfig> = {}
  if (patch.theme === 'light' || patch.theme === 'dark') next.theme = patch.theme
  if (patch.composerPosition === 'bottom' || patch.composerPosition === 'top') next.composerPosition = patch.composerPosition
  if (patch.composerWidth === 'narrow' || patch.composerWidth === 'wide') next.composerWidth = patch.composerWidth
  if (typeof patch.placeholder === 'string' && patch.placeholder.trim()) next.placeholder = patch.placeholder.trim().slice(0, 80)
  if (typeof patch.showHistory === 'boolean') next.showHistory = patch.showHistory
  if (typeof patch.suggestionsEnabled === 'boolean') next.suggestionsEnabled = patch.suggestionsEnabled
  if (typeof patch.suggestionCount === 'number') next.suggestionCount = patch.suggestionCount
  if (typeof patch.title === 'string' && patch.title.trim()) next.title = patch.title.trim().slice(0, 32)
  if (typeof patch.subtitle === 'string') next.subtitle = patch.subtitle.trim().slice(0, 80)
  if (patch.canvasMaxWidth === 'md' || patch.canvasMaxWidth === 'xl' || patch.canvasMaxWidth === 'full') {
    next.canvasMaxWidth = patch.canvasMaxWidth
  }
  if (patch.density === 'comfortable' || patch.density === 'compact') next.density = patch.density
  if (typeof patch.showModelBadge === 'boolean') next.showModelBadge = patch.showModelBadge
  return next
}

function clampCount(n: number) {
  if (!Number.isFinite(n)) return 3
  return Math.min(6, Math.max(0, Math.round(n)))
}
