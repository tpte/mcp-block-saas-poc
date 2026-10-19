import type { ChatMessage } from './useAgentSession'

export type WorkspaceUiSnapshot = {
  messages: ChatMessage[]
  composerDraft: string
  trace: string[]
}

const cache = new Map<string, WorkspaceUiSnapshot>()
const STORAGE_PREFIX = 'matrix-ws-ui:'

function storageKey(workspaceId: string) {
  return `${STORAGE_PREFIX}${workspaceId}`
}

function cloneSnapshot(data: WorkspaceUiSnapshot): WorkspaceUiSnapshot {
  return {
    messages: [...data.messages],
    composerDraft: data.composerDraft,
    trace: [...data.trace],
  }
}

export function snapshotWorkspaceUi(workspaceId: string, data: WorkspaceUiSnapshot) {
  const snap = cloneSnapshot(data)
  cache.set(workspaceId, snap)
  try {
    sessionStorage.setItem(storageKey(workspaceId), JSON.stringify(snap))
  } catch {
    /* quota or private mode */
  }
}

export function restoreWorkspaceUi(workspaceId: string): WorkspaceUiSnapshot | null {
  const hit = cache.get(workspaceId)
  if (hit) return cloneSnapshot(hit)
  try {
    const raw = sessionStorage.getItem(storageKey(workspaceId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkspaceUiSnapshot
    if (!Array.isArray(parsed.messages)) return null
    const snap = cloneSnapshot({
      messages: parsed.messages,
      composerDraft: typeof parsed.composerDraft === 'string' ? parsed.composerDraft : '',
      trace: Array.isArray(parsed.trace) ? parsed.trace.map(String) : [],
    })
    cache.set(workspaceId, snap)
    return cloneSnapshot(snap)
  } catch {
    return null
  }
}

export const LAST_SPACE_SLUG_KEY = 'matrix-last-space-slug'
