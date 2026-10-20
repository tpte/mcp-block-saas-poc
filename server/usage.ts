import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SessionContext } from '../shared/domain.ts'

/**
 * OpenRouter 用量閘門（真正打模型前才扣）。
 * - 訪客：每個 guest id 每日 MATRIX_GUEST_CHAT_DAILY 則（預設 20）。
 * - 全站：每日 MATRIX_LLM_DAILY_CAP 則（預設 500，含 admin）；admin 計入但不被擋。
 * 日界線以 Asia/Taipei 計算；計數存 .data/usage.json，重啟不歸零。
 */
const FILE = join(process.cwd(), '.data', 'usage.json')

type UsageState = { day: string; global: number; perUser: Record<string, number> }

let state: UsageState | null = null

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
}

function intEnv(name: string, fallback: number) {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

export function guestDailyLimit() {
  return intEnv('MATRIX_GUEST_CHAT_DAILY', 20)
}

export function globalDailyCap() {
  return intEnv('MATRIX_LLM_DAILY_CAP', 500)
}

function load(): UsageState {
  const day = today()
  if (!state) {
    try {
      if (existsSync(FILE)) state = JSON.parse(readFileSync(FILE, 'utf8')) as UsageState
    } catch {
      state = null
    }
  }
  if (!state || state.day !== day) state = { day, global: 0, perUser: {} }
  return state
}

function save() {
  try {
    const dir = join(FILE, '..')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(FILE, JSON.stringify(state), 'utf8')
  } catch {
    /* 計數寫檔失敗不影響回覆 */
  }
}

export type LlmGate = { ok: true } | { ok: false; reason: 'guest_daily' | 'global_daily'; message: string }

export function tryConsumeLlm(session: SessionContext): LlmGate {
  const s = load()
  if (!session.isAdmin) {
    if (s.global >= globalDailyCap()) {
      return { ok: false, reason: 'global_daily', message: '今日全站模型額度已用完，改用本機 MCP 回答。' }
    }
    const used = s.perUser[session.user.id] ?? 0
    if (used >= guestDailyLimit()) {
      return {
        ok: false,
        reason: 'guest_daily',
        message: `訪客每日 ${guestDailyLimit()} 則模型對話已用完，改用本機 MCP 回答（⌘K 不受限）。`,
      }
    }
    s.perUser[session.user.id] = used + 1
  }
  s.global += 1
  save()
  return { ok: true }
}

export function usageSnapshot(session?: SessionContext | null) {
  const s = load()
  return {
    day: s.day,
    globalUsed: s.global,
    globalCap: globalDailyCap(),
    ...(session && !session.isAdmin
      ? { guestUsed: s.perUser[session.user.id] ?? 0, guestLimit: guestDailyLimit() }
      : {}),
  }
}
