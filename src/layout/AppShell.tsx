import type { ReactNode } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { Agent, Workspace } from '../../shared/domain.ts'
import { PRODUCT_NOT_HIYEN_LABEL } from '../../shared/product.ts'
import type { DevUser, HealthInfo, PlatformConfig, SessionCapabilities } from '../mcp/client'
import { FlashBanner } from '../features/ui/FlashBanner'

type Props = {
  health: HealthInfo | null
  platform: PlatformConfig
  lastProvider: string | null
  offline: boolean
  agents: Agent[]
  activeAgentId: string
  onAgentChange: (agentId: string) => void
  workspaces?: Workspace[]
  activeWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
  devUsers?: DevUser[]
  activeUserId?: string
  onUserChange?: (userId: string) => void
  capabilities?: SessionCapabilities
  onOpenTeam?: () => void
  flash?: { text: string; variant: 'error' | 'ok' } | null
  onDismissFlash?: () => void
  onToggleMobileNav?: () => void
  showMobileNavButton?: boolean
  navHomeActive?: boolean
  navStudioActive?: boolean
  onNavHome?: () => void
  onNavStudio?: () => void
  children: ReactNode
}

export function AppShell({
  health,
  platform,
  lastProvider,
  offline,
  agents,
  activeAgentId,
  onAgentChange,
  workspaces = [],
  activeWorkspaceId,
  onWorkspaceChange,
  devUsers = [],
  activeUserId,
  onUserChange,
  capabilities,
  onOpenTeam,
  flash,
  onDismissFlash,
  onToggleMobileNav,
  showMobileNavButton,
  navHomeActive,
  navStudioActive,
  onNavHome,
  onNavStudio,
  children,
}: Props) {
  const apiUp = !offline && Boolean(health?.ok)
  const connected = apiUp && Boolean(health?.openRouterConfigured)
  const badgeLabel = offline
    ? import.meta.env.PROD
      ? 'API 未連線'
      : 'API 未連線（請 npm run dev:all）'
    : connected
      ? 'OpenRouter 已連線'
      : 'OpenRouter 未設定 Key'
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <header className="flex shrink-0 flex-col gap-2 border-b border-[var(--line)] px-4 py-2 md:flex-row md:items-center md:justify-between md:px-5 md:py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold tracking-tight">{platform.title}</p>
            <Badge
              className="hidden border border-[var(--line)] bg-transparent text-[var(--muted)] sm:inline-flex"
              title="與 HIYEN MATRIX 產品線無關"
            >
              {PRODUCT_NOT_HIYEN_LABEL}
            </Badge>
          </div>
          <p className="hidden truncate text-xs text-[var(--muted)] sm:block">{platform.subtitle}</p>
        </div>
        <div className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-wrap md:justify-end md:gap-2 md:overflow-visible md:pb-0">
          {onNavHome ? (
            <Button
              type="button"
              size="sm"
              variant={navHomeActive ? 'default' : 'outline'}
              className="text-xs"
              onClick={onNavHome}
            >
              主頁
            </Button>
          ) : null}
          {onNavStudio ? (
            <Button
              type="button"
              size="sm"
              variant={navStudioActive ? 'default' : 'outline'}
              className="text-xs"
              onClick={onNavStudio}
            >
              Studio
            </Button>
          ) : null}
          {showMobileNavButton && onToggleMobileNav ? (
            <Button type="button" size="sm" variant="outline" className="md:hidden" onClick={onToggleMobileNav}>
              模組
            </Button>
          ) : null}
          {devUsers.length > 1 && onUserChange ? (
            <label className="flex items-center gap-1 text-xs text-[var(--muted)]" title="PoC 切換身份測 RBAC">
              使用者
              <select
                className="max-w-[8rem] rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--fg)]"
                value={activeUserId}
                onChange={(e) => onUserChange(e.target.value)}
              >
                {devUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {capabilities ? (
            <Badge className="border border-[var(--line)] bg-transparent text-[var(--muted)]" title="工作區角色">
              {capabilities.role}
            </Badge>
          ) : null}
          {onOpenTeam ? (
            <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={onOpenTeam}>
              團隊
            </Button>
          ) : null}
          {workspaces.length > 0 && onWorkspaceChange ? (
            <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
              工作區
              <select
                className="rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--fg)]"
                value={activeWorkspaceId ?? health?.session?.workspaceId}
                onChange={(e) => onWorkspaceChange(e.target.value)}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : health?.session ? (
            <Badge>{health.session.workspaceName}{health.session.workspaceSample ? ' · Sample' : ''}</Badge>
          ) : null}
          {agents.length > 0 ? (
            <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
              Agent
              <select
                className="rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--fg)]"
                value={activeAgentId}
                onChange={(e) => onAgentChange(e.target.value)}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.kind})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Badge className={connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-800'}>
            {badgeLabel}
          </Badge>
          {platform.showModelBadge && health?.openRouterConfigured ? (
            <Badge className="hidden shrink-0 lg:inline-flex">
              {health.model.split('/').pop()} → {health.providerOnly.join(', ')}
              {lastProvider ? ` · ${lastProvider}` : ''}
            </Badge>
          ) : null}
        </div>
      </header>
      {health?.persistence?.ephemeral ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {health.persistence.hint}
        </div>
      ) : null}
      <FlashBanner
        message={flash?.text ?? null}
        variant={flash?.variant}
        onDismiss={() => onDismissFlash?.()}
      />
      {children}
    </div>
  )
}
