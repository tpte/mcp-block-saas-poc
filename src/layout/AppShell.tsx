import type { ReactNode } from 'react'
import { Badge } from '../components/ui/badge'
import type { HealthInfo } from '../mcp/client'

type Props = {
  health: HealthInfo | null
  lastProvider: string | null
  offline: boolean
  children: ReactNode
}

export function AppShell({ health, lastProvider, offline, children }: Props) {
  const connected = Boolean(health?.openRouterConfigured) && !offline
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-100">
      <header className="flex items-center justify-between px-5 py-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-900">Super MCP</p>
          <p className="text-xs text-slate-500">任何 MCP，即時渲染成畫面</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}>
            {offline ? 'API 未連線' : connected ? 'OpenRouter 已連線' : '離線演示'}
          </Badge>
          {health?.openRouterConfigured ? (
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
