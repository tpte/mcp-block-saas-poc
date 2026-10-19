import { randomUUID } from 'node:crypto'
import type { RunNode } from '../../shared/domain.ts'
import type { ToolTraceEntry } from '../../shared/trace.ts'
import { appendRunNodes } from '../db/store.ts'
import { getSession } from '../requestContext.ts'
import { getAgent } from '../db/store.ts'

export type TraceContext = {
  runId: string
  parentNodeId: string | null
}

export function newRunId() {
  return randomUUID()
}

export function traceToRunNodes(trace: ToolTraceEntry[], ctx: TraceContext, agentId?: string): RunNode[] {
  const session = getSession()
  const agent = getAgent(agentId ?? session.activeAgentId)
  return trace.map((entry, index) => {
    const id = randomUUID()
    const mcpServer =
      entry.tool === 'bridge:call' && entry.payload?.server ? String(entry.payload.server) : entry.tool.split(':')[0]
    return {
      id,
      runId: ctx.runId,
      parentId: index === 0 ? ctx.parentNodeId : null,
      workspaceId: session.workspace.id,
      userId: session.user.id,
      agentId: agent?.id ?? session.activeAgentId,
      tool: entry.tool,
      mcpServer,
      payloadJson: entry.payload ? JSON.stringify(entry.payload) : undefined,
      source: entry.source,
      durationMs: entry.durationMs,
      ok: entry.ok,
      error: entry.error ?? null,
      createdAt: new Date().toISOString(),
    }
  })
}

export function persistTrace(trace: ToolTraceEntry[], ctx: TraceContext, agentId?: string) {
  const nodes = traceToRunNodes(trace, ctx, agentId)
  appendRunNodes(nodes)
  return nodes
}

export function buildTopologyTree(nodes: RunNode[]) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n, children: [] as RunNode[] }]))
  const roots: typeof byId extends Map<string, infer V> ? V[] : never = []
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}
