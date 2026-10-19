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
  return process.env.OPENROUTER_SITE_URL?.trim() || 'http://localhost:5173'
}
