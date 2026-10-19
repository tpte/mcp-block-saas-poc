import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { SessionContext } from '../../shared/domain.ts'
import type { OpLogEntry, OpLogSummary } from '../../shared/opsLog.ts'

const OPS_DIR = join(process.cwd(), '.data', 'ops')
const MAX_BYTES = 2_500_000
const MAX_LINES = 4000

export function newOpLogId() {
  return randomUUID()
}

function logPath(workspaceId: string) {
  return join(OPS_DIR, `${workspaceId}.jsonl`)
}

function ensureOpsDir() {
  if (!existsSync(OPS_DIR)) mkdirSync(OPS_DIR, { recursive: true })
}

function trimLogFile(path: string) {
  if (!existsSync(path)) return
  const stat = readFileSync(path)
  if (stat.length <= MAX_BYTES) return
  const lines = stat.toString('utf8').split('\n').filter(Boolean)
  const kept = lines.slice(-MAX_LINES)
  writeFileSync(path, `${kept.join('\n')}\n`, 'utf8')
}

export function appendOpLogEntry(
  session: SessionContext,
  partial: Omit<OpLogEntry, 'ts' | 'workspaceId' | 'userId' | 'agentId'>,
): string {
  ensureOpsDir()
  const entry: OpLogEntry = {
    ...partial,
    ts: new Date().toISOString(),
    workspaceId: session.workspace.id,
    userId: session.user.id,
    agentId: session.activeAgentId,
  }
  const path = logPath(session.workspace.id)
  appendFileSync(path, `${JSON.stringify(entry)}\n`, 'utf8')
  trimLogFile(path)
  return entry.id
}

export function readOpLogEntries(workspaceId: string, limit = 80): OpLogEntry[] {
  const path = logPath(workspaceId)
  if (!existsSync(path)) return []
  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean)
  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line) as OpLogEntry)
    .reverse()
}

export function summarizeOpLog(workspaceId: string, limit = 500): OpLogSummary {
  const path = logPath(workspaceId)
  const empty: OpLogSummary = {
    total: 0,
    userMessages: 0,
    assistantReplies: 0,
    toolInvokes: 0,
    errors: 0,
    failedTools: 0,
    feedbackHelpful: 0,
    feedbackWrong: 0,
    feedbackPartial: 0,
    topFailedTools: [],
    recentErrors: [],
    recentWrongFeedback: [],
  }
  if (!existsSync(path)) return empty

  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean).slice(-limit)
  const entries = lines.map((line) => JSON.parse(line) as OpLogEntry)
  const failedByTool = new Map<string, number>()
  const recentErrors: OpLogEntry[] = []
  const recentWrongFeedback: OpLogEntry[] = []

  for (const e of entries) {
    empty.total += 1
    if (e.kind === 'user.message') empty.userMessages += 1
    if (e.kind === 'assistant.reply') empty.assistantReplies += 1
    if (e.kind === 'tool.invoke') empty.toolInvokes += 1
    if (e.kind === 'error' || !e.ok) {
      empty.errors += 1
      if (recentErrors.length < 8) recentErrors.push(e)
    }
    if (e.kind === 'feedback' && e.feedback) {
      if (e.feedback.rating === 'helpful') empty.feedbackHelpful += 1
      if (e.feedback.rating === 'wrong') {
        empty.feedbackWrong += 1
        if (recentWrongFeedback.length < 8) recentWrongFeedback.push(e)
      }
      if (e.feedback.rating === 'partial') empty.feedbackPartial += 1
    }
    for (const tool of e.output?.toolsUsed ?? []) {
      if (!e.ok) {
        empty.failedTools += 1
        failedByTool.set(tool, (failedByTool.get(tool) ?? 0) + 1)
      }
    }
    if (e.input?.tool && !e.ok) {
      failedByTool.set(e.input.tool, (failedByTool.get(e.input.tool) ?? 0) + 1)
    }
  }

  empty.topFailedTools = [...failedByTool.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tool, count]) => ({ tool, count }))
  empty.recentErrors = recentErrors.reverse()
  empty.recentWrongFeedback = recentWrongFeedback.reverse()
  return empty
}
