import type { McpUiResponse } from '../../shared/ui.ts'
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

export const PLATFORM_TOOL = 'platform:patch'
export const BRIDGE_LIST = 'bridge:list'
export const BRIDGE_CALL = 'bridge:call'
export const COMPOSE_TOOL = 'canvas:compose'

export function dispatchTool(name: string, payload?: Record<string, unknown>) {
  if (name === PLATFORM_TOOL) {
    applyPlatformPatch(payload as Partial<PlatformConfig>)
    return { ui: null as McpUiResponse | null }
  }
  if (name === BRIDGE_LIST) {
    noteTopic('bridge')
    return { ui: listMountedMcps() }
  }
  if (name === COMPOSE_TOOL) {
    return { ui: composeCanvas(payload) }
  }
  if (name === BRIDGE_CALL) {
    noteTopic('bridge')
    const server = String(payload?.server ?? '')
    const tool = String(payload?.tool ?? '')
    const args = (payload?.args as Record<string, unknown> | undefined) ?? {}
    return { ui: callMountedMcp(server, tool, args) }
  }
  noteTopic(topicFromTool(name))
  return { ui: invokeMcpTool(name, payload) }
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
