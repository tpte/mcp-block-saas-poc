import {
  mergeKeyboardShortcuts,
  type KeyboardAction,
  type KeyboardShortcuts,
  type PlatformConfig,
} from '../../../shared/platform.ts'

export type ShortcutHandler = (event: KeyboardEvent) => void

function normalizeEventKey(event: KeyboardEvent) {
  const parts: string[] = []
  if (event.metaKey) parts.push('Meta')
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  let key = event.key
  if (key === '/') key = '/'
  if (key.length === 1) key = key.toUpperCase()
  if (!['Meta', 'Ctrl', 'Alt', 'Shift'].includes(key)) parts.push(key)
  return parts.join('+')
}

function chordToParts(chord: string) {
  return chord.split('+').map((p) => p.trim())
}

export function chordMatches(event: KeyboardEvent, chord: string) {
  const expected = chordToParts(chord)
  const actual = chordToParts(normalizeEventKey(event))
  if (expected.length !== actual.length) return false
  return expected.every((part, i) => part.toLowerCase() === actual[i]?.toLowerCase())
}

export function getResolvedShortcuts(platform: PlatformConfig): Record<KeyboardAction, string> {
  return mergeKeyboardShortcuts(platform.keyboardShortcuts)
}

export function installShortcutListener(
  platform: PlatformConfig,
  handlers: Partial<Record<KeyboardAction, ShortcutHandler>>,
) {
  const shortcuts = getResolvedShortcuts(platform)
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      if (handlers.openCommandPalette && chordMatches(event, shortcuts.openCommandPalette)) {
        event.preventDefault()
        handlers.openCommandPalette(event)
      }
      if (handlers.focusComposer && chordMatches(event, shortcuts.focusComposer)) {
        event.preventDefault()
        handlers.focusComposer(event)
      }
      return
    }
    for (const action of Object.keys(handlers) as KeyboardAction[]) {
      const handler = handlers[action]
      if (!handler) continue
      if (chordMatches(event, shortcuts[action])) {
        event.preventDefault()
        handler(event)
        break
      }
    }
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}

export function formatShortcutsList(platform: PlatformConfig) {
  const s = getResolvedShortcuts(platform)
  return (Object.keys(s) as KeyboardAction[]).map((action) => `${action}: ${s[action]}`).join('\n')
}

export type { KeyboardShortcuts }
