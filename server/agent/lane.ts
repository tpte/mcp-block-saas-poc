export type TurnLane = 'chat' | 'lookup' | 'data' | 'build'

const BUILD = /資料源|後台|模組|畫布|manifest|模板|打造|啟用|客製|skill|studio|調整這個工作區/i
const LOOKUP = /搜尋|搜一下|查一下|上網|網路上|最新|新聞|天氣|股價|匯率|是誰|是什麼|什麼是|查詢/

export function classifyTurn(text: string): TurnLane {
  const t = text.trim()
  if (dataToolFor(t) && !BUILD.test(t)) return 'data'
  if (BUILD.test(t)) return 'build'
  if (LOOKUP.test(t)) return 'lookup'
  return 'chat'
}

export function isConversational(text: string) {
  const lane = classifyTurn(text)
  return lane === 'chat' || lane === 'lookup'
}

/** 問得夠具體就直接對應一個資料工具，不讓模型自己亂呼叫。 */
export function dataToolFor(text: string): string | null {
  if (/發票/.test(text)) return 'finance:list_invoices'
  if (/現金|財務|cashflow/i.test(text)) return 'finance:get_cashflow'
  if (/業務|pipeline|銷售|漏斗/i.test(text)) return 'sales:pipeline'
  if (/庫存|進銷|inventory/i.test(text)) return 'inventory:stock_alerts'
  if (/客服|工單|support/i.test(text)) return 'support:open_tickets'
  if (/報表|kpi|渠道|analytics/i.test(text)) return 'analytics:kpi_week'
  if (/請假|員工|人資|\bhr\b/i.test(text)) return 'hr:get_leave'
  return null
}

export function dataReply(tool: string) {
  if (tool.startsWith('hr:')) return '這是這個月的請假。'
  if (tool.startsWith('finance:')) return '這是財務資料。'
  if (tool.startsWith('sales:')) return '這是業務資料。'
  if (tool.startsWith('inventory:')) return '這是庫存資料。'
  if (tool.startsWith('support:')) return '這是客服資料。'
  if (tool.startsWith('analytics:')) return '這是報表。'
  return '這是你要的資料。'
}

/** 不需模型的短答。回 null 表示仍要走對話模型。 */
export function localAnswer(text: string): string | null {
  const t = text.trim()
  if (/^(早|早安|你好|嗨|哈囉|hi|hello)[！!。.\s]*$/i.test(t)) return chatFallback(t)
  if (/^(謝謝|感謝|多謝)[！!。.\s]*$/.test(t)) return chatFallback(t)
  if (/^(晚安|掰|再見)[！!。.\s]*$/.test(t)) return chatFallback(t)
  if (/接上.*(資料|公司)|公司資料|設定資料源|還缺什麼|先客製/.test(t)) {
    return '想看現成資料，直接說「看這個月的請假」或「本週現金流」。要接自己的資料庫，到「我」打開這個工作區的調整。'
  }
  if (/^(現在幾點|現在時間|今天幾號|今天日期)[？?。!！\s]*$/.test(t)) {
    return `現在是${new Intl.DateTimeFormat('zh-TW', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Taipei',
    }).format(new Date())}。`
  }
  const expr = t.match(/(?:幫我)?(?:算|計算)\s*([0-9+\-*/().%\s]+)(?:等於多少)?[？?。!！\s]*$/)
  if (!expr) return null
  const value = safeCalc(expr[1]!)
  return value == null ? null : `${expr[1]!.replace(/\s+/g, '')} = ${value}`
}

export function safeCalc(raw: string): number | null {
  const expr = raw.replace(/\s+/g, '')
  if (!expr || !/^[0-9+\-*/().%]+$/.test(expr)) return null
  try {
    const value = Function(`"use strict"; return (${expr})`)() as unknown
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export function chatFallback(text: string): string {
  if (/早|你好|嗨|哈囉|hi|hello/i.test(text)) return '早安。想聊天、查資料，或看工作區的數字，直接說就好。'
  if (/謝/.test(text)) return '不客氣。'
  if (/晚安|掰|再見/.test(text)) return '晚安，有需要再叫我。'
  return '我在。你可以跟我聊天，或叫我搜尋、看請假、現金流、庫存這類資料。'
}
