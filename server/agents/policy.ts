import type { Agent } from '../../shared/domain.ts'
import { getAgent } from '../db/store.ts'
import { getSession } from '../requestContext.ts'
import { AGENT_DELEGATE, BRIDGE_CALL } from '../mcp/tools.ts'

export class PolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PolicyError'
  }
}

export function getActiveAgent(): Agent {
  const { activeAgentId } = getSession()
  const agent = getAgent(activeAgentId)
  if (!agent) throw new PolicyError(`找不到 Agent：${activeAgentId}`)
  return agent
}

export function assertToolAllowed(tool: string, payload?: Record<string, unknown>) {
  assertToolAllowedForAgent(getActiveAgent(), tool, payload)
}

export function assertToolAllowedForAgent(agent: Agent, tool: string, payload?: Record<string, unknown>) {
  if (tool === AGENT_DELEGATE) {
    if (!agent.policy.canDelegate) throw new PolicyError(`${agent.name} 不可 delegate`)
    return
  }
  if (tool === BRIDGE_CALL) {
    const server = String(payload?.server ?? '')
    if (server && agent.policy.allowedMcpServers.length > 0 && !agent.policy.allowedMcpServers.includes(server)) {
      throw new PolicyError(`${agent.name} 不可呼叫 MCP：${server}`)
    }
  }
  if (tool.startsWith('web:') || tool.startsWith('util:')) return
  const allowed = agent.policy.allowedToolPrefixes.some((prefix) => tool.startsWith(prefix))
  if (!allowed) throw new PolicyError(`${agent.name} 不可使用 tool：${tool}`)
}

export function filterToolsForAgent<T extends { function: { name: string } }>(tools: T[], agentId: string): T[] {
  const agent = getAgent(agentId)
  if (!agent) return tools
  return tools.filter((def) => {
    try {
      assertToolAllowedForAgent(agent, def.function.name)
      return true
    } catch {
      return false
    }
  })
}
