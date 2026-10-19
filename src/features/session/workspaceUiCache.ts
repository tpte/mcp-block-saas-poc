import type { ChatMessage } from './useAgentSession'

export type WorkspaceUiSnapshot = {
  messages: ChatMessage[]
  composerDraft: string
  trace: string[]
}

const cache = new Map<string, WorkspaceUiSnapshot>()

export function snapshotWorkspaceUi(
  workspaceId: string,
  data: WorkspaceUiSnapshot,
) {
  cache.set(workspaceId, {
    messages: [...data.messages],
    composerDraft: data.composerDraft,
    trace: [...data.trace],
  })
}

export function restoreWorkspaceUi(workspaceId: string): WorkspaceUiSnapshot | null {
  const hit = cache.get(workspaceId)
  if (!hit) return null
  return {
    messages: [...hit.messages],
    composerDraft: hit.composerDraft,
    trace: [...hit.trace],
  }
}

export const LAST_SPACE_SLUG_KEY = 'matrix-last-space-slug'
