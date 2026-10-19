export type BlockSortMode = 'agent' | 'importance' | 'type'
export type LayoutEmphasis = 'summary-first' | 'actions-first'
export type DefaultCanvasLayout = 'stack' | 'grid' | 'hero'

export type LayoutPreferences = {
  blockSort: BlockSortMode
  defaultCanvasLayout: DefaultCanvasLayout
  emphasis: LayoutEmphasis
}

export type KeyboardAction =
  | 'openCommandPalette'
  | 'focusComposer'
  | 'expandBlock'
  | 'nextBlock'
  | 'prevBlock'
  | 'closeOverlay'
  | 'showShortcuts'

export type KeyboardShortcuts = Partial<Record<KeyboardAction, string>>

export const DEFAULT_KEYBOARD_SHORTCUTS: Record<KeyboardAction, string> = {
  openCommandPalette: 'Meta+K',
  focusComposer: 'Meta+/',
  expandBlock: 'Enter',
  nextBlock: 'Alt+ArrowDown',
  prevBlock: 'Alt+ArrowUp',
  closeOverlay: 'Escape',
  showShortcuts: 'Meta+?',
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  blockSort: 'agent',
  defaultCanvasLayout: 'stack',
  emphasis: 'summary-first',
}

export type PlatformConfig = {
  theme: 'light' | 'dark'
  composerPosition: 'bottom' | 'top'
  composerWidth: 'narrow' | 'wide'
  placeholder: string
  showHistory: boolean
  suggestionsEnabled: boolean
  suggestionCount: number
  title: string
  subtitle: string
  canvasMaxWidth: 'md' | 'xl' | 'full'
  density: 'comfortable' | 'compact'
  showModelBadge: boolean
  moduleSidebarEnabled: boolean
  modulePillsEnabled: boolean
  commandPaletteEnabled: boolean
  showToolTrace: boolean
  keyboardShortcuts: KeyboardShortcuts
  layoutPreferences: LayoutPreferences
}

export function mergeKeyboardShortcuts(overrides?: KeyboardShortcuts): Record<KeyboardAction, string> {
  return { ...DEFAULT_KEYBOARD_SHORTCUTS, ...overrides }
}
