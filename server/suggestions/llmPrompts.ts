import { getOpenRouterKey, getOpenRouterModel, getSiteUrl } from '../env.ts'
import { getAgent } from '../db/store.ts'
import { predictPrompts } from '../mcp/platform.ts'
import { PRODUCT_OPENROUTER_APP_TITLE } from '../../shared/product.ts'

export type SuggestionContext = {
  agentId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  canvasSummary?: string
  count: number
}

function fallback(count: number) {
  return predictPrompts().slice(0, count)
}

function parseSuggestions(raw: string, count: number): string[] {
  const trimmed = raw.trim()
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x).trim()).filter(Boolean).slice(0, count)
    }
  } catch {
    /* try line parse */
  }
  const lines = trimmed
    .split('\n')
    .map((line) => line.replace(/^[\d\-*•.\s]+/, '').trim())
    .filter(Boolean)
  if (lines.length) return lines.slice(0, count)
  return []
}

export async function llmPredictSuggestions(ctx: SuggestionContext): Promise<string[]> {
  const key = getOpenRouterKey()
  const count = Math.min(6, Math.max(1, ctx.count))
  if (!key) return fallback(count)

  const agent = getAgent(ctx.agentId)
  const recent = ctx.messages.slice(-8)
  const transcript = recent.map((m) => `${m.role === 'user' ? '使用者' : 'Agent'}：${m.content}`).join('\n')
  const system = `你是「下一句建議」引擎。根據對話與畫布摘要，預測使用者接下來最可能輸入的 ${count} 句話。
每句須是完整、可直送的中文短句（8–28 字），可包含：追問資料、切換模組、改 UI、delegate 其他 agent、或操作 MCP。
只輸出 JSON 字串陣列，不要 markdown，不要解釋。Agent 角色：${agent?.name ?? 'personal'} (${agent?.kind ?? 'unknown'})。`

  const user = [
    transcript || '（尚無對話，使用者剛打開工作台）',
    ctx.canvasSummary ? `畫布摘要：${ctx.canvasSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': getSiteUrl(),
        'X-Title': `${PRODUCT_OPENROUTER_APP_TITLE} Suggestions`,
      },
      body: JSON.stringify({
        model: getOpenRouterModel(),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
        max_tokens: 280,
      }),
    })
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content ?? ''
    const list = parseSuggestions(content, count)
    if (list.length >= 1) return list
  } catch (err) {
    console.warn('llmPredictSuggestions failed', err)
  }
  return fallback(count)
}
