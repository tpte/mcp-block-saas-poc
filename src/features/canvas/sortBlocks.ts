import type { LayoutPreferences } from '../../../shared/platform.ts'
import type { UiBlock } from '../../types/ui.ts'

const ROLE_ORDER: Record<string, number> = {
  summary: 0,
  action: 1,
  detail: 2,
  context: 3,
}

export function sortBlocks(blocks: UiBlock[], prefs: LayoutPreferences): UiBlock[] {
  if (prefs.blockSort === 'agent') return blocks
  const copy = [...blocks]
  if (prefs.blockSort === 'importance') {
    copy.sort((a, b) => (b.presentation?.priority ?? 0) - (a.presentation?.priority ?? 0))
    return copy
  }
  if (prefs.blockSort === 'type') {
    copy.sort((a, b) => {
      const ra = ROLE_ORDER[a.presentation?.role ?? 'detail'] ?? 9
      const rb = ROLE_ORDER[b.presentation?.role ?? 'detail'] ?? 9
      if (ra !== rb) return ra - rb
      return (b.presentation?.priority ?? 0) - (a.presentation?.priority ?? 0)
    })
    if (prefs.emphasis === 'actions-first') {
      copy.sort((a, b) => {
        const aa = a.presentation?.role === 'action' ? 0 : 1
        const ab = b.presentation?.role === 'action' ? 0 : 1
        return aa - ab
      })
    }
  }
  return copy
}
