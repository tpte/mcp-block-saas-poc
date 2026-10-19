export type TurnLane = 'chat' | 'lookup' | 'workspace'

const WORKSPACE =
  /請假|員工|人資|現金|發票|財務|庫存|進銷|客服|工單|報表|kpi|看板|銷售|業務|pipeline|資料源|後台|模組|畫布|manifest|模板|打造|啟用/i

const LOOKUP = /搜尋|搜一下|查一下|上網|網路上|最新|新聞|天氣|股價|匯率|是誰|是什麼|什麼是|查詢/

export function classifyTurn(text: string): TurnLane {
  const t = text.trim()
  if (WORKSPACE.test(t)) return 'workspace'
  if (LOOKUP.test(t)) return 'lookup'
  return 'chat'
}

/** 不需模型的短答。回 null 表示仍要走對話模型。 */
export function localAnswer(text: string): string | null {
  const t = text.trim()
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
