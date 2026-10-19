import type { McpUiResponse } from '../../shared/ui.ts'
import type { ToolTraceEntry } from '../../shared/trace.ts'
import { runAgentDelegate } from '../agents/delegate.ts'
import { assertToolAllowed, PolicyError } from '../agents/policy.ts'
import { callMountedMcp, listMountedMcps } from './bridge.ts'
import { composeCanvas, speechToBlocks } from './compose.ts'
import { invokeMcpTool } from './handlers.ts'
import {
  applyPlatformPatch,
  getPlatform,
  interpretPlatform,
  looksLikeData,
  noteTopic,
  predictPrompts,
  topicFromMessage,
  topicFromTool,
  type PlatformConfig,
} from './platform.ts'
import { AGENT_DELEGATE, BRIDGE_CALL, BRIDGE_LIST, COMPOSE_TOOL, PLATFORM_TOOL } from './tools.ts'

export { PLATFORM_TOOL, BRIDGE_LIST, BRIDGE_CALL, COMPOSE_TOOL, AGENT_DELEGATE } from './tools.ts'

export type DispatchMeta = {
  source: ToolTraceEntry['source']
  mode?: ToolTraceEntry['mode']
  provider?: string | null
}

export async function dispatchToolWithTrace(
  name: string,
  payload?: Record<string, unknown>,
  meta: DispatchMeta = { source: 'invoke' },
): Promise<{ ui: McpUiResponse | null; trace: ToolTraceEntry[] }> {
  const started = performance.now()
  try {
    assertToolAllowed(name, payload)
    const ui = await dispatchToolInner(name, payload)
    return {
      ui,
      trace: [
        {
          tool: name,
          payload,
          source: meta.source,
          mode: meta.mode,
          provider: meta.provider,
          durationMs: Math.round(performance.now() - started),
          ok: true,
        },
      ],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'dispatch failed'
    const ui =
      err instanceof PolicyError
        ? speechToBlocks(message)
        : null
    return {
      ui,
      trace: [
        {
          tool: name,
          payload,
          source: meta.source,
          mode: meta.mode,
          provider: meta.provider,
          durationMs: Math.round(performance.now() - started),
          ok: false,
          error: message,
        },
      ],
    }
  }
}

async function dispatchToolInner(name: string, payload?: Record<string, unknown>): Promise<McpUiResponse | null> {
  if (name === PLATFORM_TOOL) {
    applyPlatformPatch(payload as Partial<PlatformConfig>)
    return null
  }
  if (name === BRIDGE_LIST) {
    noteTopic('bridge')
    return listMountedMcps()
  }
  if (name === COMPOSE_TOOL) {
    return composeCanvas(payload)
  }
  if (name === AGENT_DELEGATE) {
    const targetAgentId = String(payload?.targetAgentId ?? '')
    const task = String(payload?.task ?? '')
    return runAgentDelegate(targetAgentId, task)
  }
  if (name === BRIDGE_CALL) {
    noteTopic('bridge')
    const server = String(payload?.server ?? '')
    const tool = String(payload?.tool ?? '')
    const args = (payload?.args as Record<string, unknown> | undefined) ?? {}
    return callMountedMcp(server, tool, args)
  }
  noteTopic(topicFromTool(name))
  return invokeMcpTool(name, payload)
}

export function finalizeTurn(message: string, ui: McpUiResponse | null) {
  const patch = interpretPlatform(message)
  if (patch) applyPlatformPatch(patch)
  const topic = topicFromMessage(message)
  if (topic) noteTopic(topic)
  const platformOnly = Boolean(patch) && !looksLikeData(message)
  const rendered = platformOnly ? speechToBlocks('已透過 platform MCP 更新外殼。') : ui
  return {
    ui: rendered,
    platform: getPlatform(),
    suggestions: predictPrompts(),
    platformOnly,
  }
}
