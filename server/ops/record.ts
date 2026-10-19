import type { SessionContext } from '../../shared/domain.ts'
import type { OpFeedbackRating } from '../../shared/opsLog.ts'
import type { ToolTraceEntry } from '../../shared/trace.ts'
import { appendOpLogEntry, newOpLogId } from './logStore.ts'

function clip(text: string, max = 2000) {
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

function toolsFromTrace(trace: ToolTraceEntry[]) {
  return [...new Set(trace.map((t) => t.tool))]
}

export function logUserMessage(
  session: SessionContext,
  text: string,
  meta?: { source?: 'chat' | 'invoke' | 'catalog' | 'suggestion' | 'block' },
) {
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    kind: 'user.message',
    ok: true,
    input: { text: clip(text), source: meta?.source ?? 'chat' },
  })
}

export function logAssistantReply(
  session: SessionContext,
  opts: {
    parentId: string
    userText: string
    runId: string
    mode: string
    assistantMessage: string
    trace: ToolTraceEntry[]
    provider?: string | null
    error?: string
    durationMs?: number
    ok?: boolean
  },
) {
  const traceFailed = opts.trace.some((t) => !t.ok)
  const ok = opts.ok ?? (!traceFailed && !opts.error)
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    parentId: opts.parentId,
    kind: 'assistant.reply',
    ok,
    runId: opts.runId,
    durationMs: opts.durationMs,
    provider: opts.provider ?? null,
    mode: opts.mode,
    input: { text: clip(opts.userText) },
    output: {
      assistantPreview: clip(opts.assistantMessage, 600),
      toolsUsed: toolsFromTrace(opts.trace),
      error: opts.error,
    },
  })
}

export function logToolInvoke(
  session: SessionContext,
  opts: {
    parentId?: string
    runId: string
    tool: string
    payload?: Record<string, unknown>
    trace: ToolTraceEntry[]
    durationMs: number
  },
) {
  const ok = opts.trace.every((t) => t.ok)
  const err = opts.trace.find((t) => !t.ok)?.error
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    parentId: opts.parentId,
    kind: 'tool.invoke',
    ok,
    runId: opts.runId,
    durationMs: opts.durationMs,
    input: { tool: opts.tool, payload: opts.payload, source: 'invoke' },
    output: {
      toolsUsed: toolsFromTrace(opts.trace),
      error: err,
    },
  })
}

export function logFeedback(
  session: SessionContext,
  opts: { targetEntryId: string; rating: OpFeedbackRating; comment?: string },
) {
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    kind: 'feedback',
    ok: true,
    feedback: {
      targetEntryId: opts.targetEntryId,
      rating: opts.rating,
      comment: opts.comment ? clip(opts.comment, 500) : undefined,
    },
  })
}

export function logCanvasOp(
  session: SessionContext,
  kind: 'canvas.edit' | 'canvas.add' | 'canvas.delete',
  detail: { blockId?: string; templateId?: string },
) {
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    kind,
    ok: true,
    input: detail,
  })
}

export function logManifestEdit(session: SessionContext, revision: number) {
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    kind: 'manifest.edit',
    ok: true,
    output: { assistantPreview: `revision ${revision}` },
  })
}

export function logError(
  session: SessionContext,
  opts: { message: string; runId?: string; parentId?: string; tool?: string },
) {
  return appendOpLogEntry(session, {
    id: newOpLogId(),
    parentId: opts.parentId,
    kind: 'error',
    ok: false,
    runId: opts.runId,
    input: opts.tool ? { tool: opts.tool } : undefined,
    output: { error: clip(opts.message, 800) },
  })
}
