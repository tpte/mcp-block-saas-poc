import { Button } from '../../components/ui/button'
import { formatShortcutsList } from './shortcutRegistry'
import type { PlatformConfig } from '../../mcp/client'

type Props = {
  open: boolean
  platform: PlatformConfig
  onClose: () => void
}

export function ShortcutsHelpModal({ open, platform, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" className="max-w-md rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl">
        <h2 className="text-sm font-semibold">快捷鍵</h2>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-[var(--muted)]">{formatShortcutsList(platform)}</pre>
        <Button type="button" className="mt-4" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>
    </div>
  )
}
