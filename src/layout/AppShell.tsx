import type { ReactNode } from 'react'
import { Badge } from '../components/ui/badge'
import type { Agent, Workspace } from '../../shared/domain.ts'
import { PRODUCT_NOT_HIYEN_LABEL } from '../../shared/product.ts'
import type { HealthInfo, PlatformConfig } from '../mcp/client'

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
      <header className="flex items-center justify-between px-5 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-tight">{platform.title}</p>
            <Badge
              className="border border-[var(--line)] bg-transparent text-[var(--muted)]"
              title="與 HIYEN MATRIX 產品線無關"
            >
              {PRODUCT_NOT_HIYEN_LABEL}
            </Badge>
          </div>
          <p className="text-xs text-[var(--muted)]">{platform.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
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
            <Badge>
              {health.model.split('/').pop()} → {health.providerOnly.join(', ')}
              {lastProvider ? ` · ${lastProvider}` : ''}
            </Badge>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  )
}
