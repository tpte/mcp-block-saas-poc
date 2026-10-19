import type { McpUiResponse } from '../../shared/ui.ts'
import { getAgent, resolveSession } from '../db/store.ts'
import { runWithSession } from '../requestContext.ts'
import { runKeywordAgent } from '../mcp/handlers.ts'
import { speechToBlocks } from '../mcp/compose.ts'

export async function runAgentDelegate(targetAgentId: string, task: string): Promise<McpUiResponse> {
  const target = getAgent(targetAgentId)
  if (!target) {
    return speechToBlocks(`找不到 worker Agent：${targetAgentId}`)
  }
  const text = task.trim() || '請處理工作區任務'
  const session = resolveSession(target.ownerUserId, target.workspaceId, target.id)
  return runWithSession(session, () => runKeywordAgent(text))
}
