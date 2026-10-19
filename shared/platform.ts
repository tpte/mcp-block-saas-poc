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
}
