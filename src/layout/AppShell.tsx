import type { ReactNode } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { HealthInfo } from '../mcp/client'
import { MODULES } from '../features/session/useAgentSession'

type Props = {
  health: HealthInfo | null
  lastProvider: string | null
  activeModule: string
  busy: boolean
  onSelectModule: (id: string, tool?: string) => void
  children: ReactNode
}

export function AppShell({
  health,
  lastProvider,
  activeModule,
  busy,
  onSelectModule,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">MCP Block SaaS · MVP</p>
            <h1 className="text-xl font-semibold text-slate-900">
              {health?.tenant.name ?? '北極星科技'} · Agent 工作區
            </h1>
            <p className="text-sm text-slate-500">
              {health?.tenant.user} · {health?.tenant.role}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={health?.openRouterConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}>
              {health?.openRouterConfigured ? 'OpenRouter 已連線' : '離線演示'}
            </Badge>
            {health?.openRouterConfigured ? (
              <Badge>
                {health.model.split('/').pop()} → {health.providerOnly.join(', ')}
                {lastProvider ? ` · ${lastProvider}` : ''}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">模組</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Button
                  variant={activeModule === 'home' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => onSelectModule('home')}
                >
                  首頁 Dashboard
                </Button>
              </li>
              {MODULES.map((mod) => (
                <li key={mod.id}>
                  <Button
                    variant={activeModule === mod.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    disabled={busy}
                    onClick={() => onSelectModule(mod.id, mod.tool)}
                  >
                    {mod.label}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <main className="space-y-4">{children}</main>
      </div>
    </div>
  )
}
