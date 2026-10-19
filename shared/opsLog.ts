/** Persistent audit / quality log for user ops, replies, tools, and feedback. */
export type OpFeedbackRating = 'helpful' | 'wrong' | 'partial'

export type OpLogKind =
  | 'user.message'
  | 'assistant.reply'
  | 'tool.invoke'
  | 'feedback'
  | 'error'
  | 'canvas.edit'
  | 'canvas.add'
  | 'canvas.delete'
  | 'manifest.edit'

export type OpLogEntry = {
  id: string
  ts: string
  workspaceId: string
  userId: string
  agentId: string
  parentId?: string
  runId?: string
  kind: OpLogKind
  ok: boolean
  durationMs?: number
  provider?: string | null
  mode?: string
  input?: {
    text?: string
    tool?: string
    payload?: Record<string, unknown>
    source?: string
  }
  output?: {
    assistantPreview?: string
    toolsUsed?: string[]
    error?: string
  }
  feedback?: {
    targetEntryId: string
    rating: OpFeedbackRating
    comment?: string
  }
}

export type OpLogSummary = {
  total: number
  userMessages: number
  assistantReplies: number
  toolInvokes: number
  errors: number
  failedTools: number
  feedbackHelpful: number
  feedbackWrong: number
  feedbackPartial: number
  topFailedTools: { tool: string; count: number }[]
  recentErrors: OpLogEntry[]
  recentWrongFeedback: OpLogEntry[]
}
