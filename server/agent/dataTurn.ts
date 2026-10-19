import type { Agent } from '../../shared/domain.ts'
import { getAgent, getDb, resolveSession } from '../db/store.ts'
import { invokeMcpTool } from '../mcp/handlers.ts'
import { getSession, runWithSession } from '../requestContext.ts'
import { dataToolFor } from './lane.ts'

function allows(agent: Agent, tool: string) {
  return agent.policy.allowedToolPrefixes.some((prefix) => tool.startsWith(prefix))
}

function agentForTool(tool: string): Agent | undefined {
  const { workspace, activeAgentId } = getSession()
  const current = getAgent(activeAgentId)
  if (current && allows(current, tool)) return current
  const mates = getDb().agents.filter((agent) => agent.workspaceId === workspace.id)
  return mates.find((agent) => agent.kind !== 'orchestrator' && allows(agent, tool)) ?? mates.find((agent) => allows(agent, tool))
}

export async function runDirectData(text: string) {
  const tool = dataToolFor(text)
  if (!tool) return null
  const agent = agentForTool(tool)
  if (!agent || !allows(agent, tool)) return null
  const session = resolveSession(agent.ownerUserId, agent.workspaceId, agent.id)
  const ui = await runWithSession(session, () => invokeMcpTool(tool))
  return { tool, agentId: agent.id, ui }
}
