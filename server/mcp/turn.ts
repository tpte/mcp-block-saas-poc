import type { McpUiResponse } from '../../shared/ui.ts'
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

export function dispatchTool(name: string, payload?: Record<string, unknown>) {
  if (name === PLATFORM_TOOL) {
    applyPlatformPatch(payload as Partial<PlatformConfig>)
    return { ui: null as McpUiResponse | null }
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
  return {
    ui: platformOnly ? null : ui,
    platform: getPlatform(),
    suggestions: predictPrompts(),
    platformOnly,
  }
}
