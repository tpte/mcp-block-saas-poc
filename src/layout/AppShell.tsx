import type { ReactNode } from 'react'
import { Button } from '../components/ui/button'
import type { HealthInfo, PlatformConfig } from '../mcp/client'
import { FlashBanner } from '../features/ui/FlashBanner'

type Props = {
  health: HealthInfo | null
  platform: PlatformConfig
  offline: boolean
  flash?: { text: string; variant: 'error' | 'ok' } | null
  onDismissFlash?: () => void
  navMeActive?: boolean
  onNavHome?: () => void
  onNavMe?: () => void
  showSpaceContext?: boolean
  children: ReactNode
}

export function AppShell({
  health,
  platform,
  offline,
  flash,
  onDismissFlash,
  navMeActive,
  onNavHome,
  onNavMe,
  showSpaceContext,
  children,
}: Props) {
  const apiUp = !offline && Boolean(health?.ok)
  const connected = apiUp && Boolean(health?.openRouterConfigured)
  const statusLabel = offline
    ? '未連線'
    : connected
      ? '可對話'
      : '尚未設定模型'
  const pageTitle = showSpaceContext ? platform.title : navMeActive ? '我' : 'MATRIX'
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-1.5 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {onNavHome ? (
            <button
              type="button"
              className="shrink-0 text-sm font-semibold tracking-tight"
              onClick={onNavHome}
            >
              MATRIX
            </button>
          ) : (
            <p className="text-sm font-semibold tracking-tight">MATRIX</p>
          )}
          {showSpaceContext ? (
            <p className="truncate text-sm text-[var(--muted)]">{pageTitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-block size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            title={statusLabel}
            aria-label={statusLabel}
          />
          {onNavMe ? (
            <Button type="button" size="sm" variant={navMeActive ? 'default' : 'ghost'} className="text-xs" onClick={onNavMe}>
              我
            </Button>
          ) : null}
        </div>
      </header>
      {offline ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          無法連上伺服器，每幾秒會自動重試。
        </div>
      ) : null}
      {health?.persistence?.ephemeral ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {health.persistence.hint}
        </div>
      ) : null}
      {!offline && apiUp && !connected ? (
        <div className="border-b border-[var(--line)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--muted)]">
          請在環境變數設定 OpenRouter 以啟用進階對話；寒暄與查資料仍可用。
        </div>
      ) : null}
      <FlashBanner message={flash?.text ?? null} variant={flash?.variant} onDismiss={() => onDismissFlash?.()} />
      {children}
    </div>
  )
}
