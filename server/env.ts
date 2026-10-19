import { config } from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

config()

function readHermesKey(): string | undefined {
  const path = join(homedir(), '.hermes', '.env')
  if (!existsSync(path)) return undefined
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^OPENROUTER_API_KEY=(.+)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return undefined
}

export function getOpenRouterKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.OPENROUTERKEY?.trim() ||
    readHermesKey()
  )
}

export function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-v4.1-flash-1017'
}

export function getProviderOnly(): string[] {
  const raw = process.env.OPENROUTER_PROVIDER_ONLY?.trim() || 'Together'
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function allowProviderFallbacks() {
  return process.env.OPENROUTER_ALLOW_FALLBACKS === 'true'
}

export function getSiteUrl() {
  const explicit = process.env.OPENROUTER_SITE_URL?.trim()
  if (explicit) return explicit
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()
  if (railway) return `https://${railway}`
  return 'http://localhost:5173'
}

export type StdioServerConfig = {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

export function getStdioServerConfigs(): StdioServerConfig[] {
  const raw = process.env.MCP_STDIO_SERVERS?.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as StdioServerConfig[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item?.name && item?.command)
  } catch {
    console.warn('MCP_STDIO_SERVERS JSON 無法解析，已略過')
    return []
  }
}
