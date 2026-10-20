import type { McpUiResponse } from '../../shared/ui.ts'
import { getAgent, resolveSession } from '../db/store.ts'
import { getSession, runWithSession } from '../requestContext.ts'
import { runKeywordAgent } from '../mcp/handlers.ts'
import { speechToBlocks } from '../mcp/compose.ts'

export async function runAgentDelegate(targetAgentId: string, task: string): Promise<McpUiResponse> {
  const target = getAgent(targetAgentId)
  if (!target) {
    return speechToBlocks(`找不到 worker Agent：${targetAgentId}`)
  }
  const caller = getSession()
  // 只能委派給同一工作區的 Agent，避免訪客借用其他使用者的身份。
  if (target.workspaceId !== caller.workspace.id && !caller.isAdmin) {
    return speechToBlocks(`無法委派給其他工作區的 Agent：${targetAgentId}`)
  }
  const text = task.trim() || '請處理工作區任務'
  const session = {
    ...resolveSession(target.ownerUserId, target.workspaceId, target.id),
    isAdmin: caller.isAdmin,
    isGuest: caller.isGuest,
  }
  return runWithSession(session, () => runKeywordAgent(text))
}
