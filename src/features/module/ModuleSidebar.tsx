import { cn } from '../../lib/utils'
import type { CatalogItem } from '../../mcp/client'
import type { WorkspaceModule } from '../../../shared/modulePage.ts'

type Props = {
  modules: WorkspaceModule[]
  modulesLoading?: boolean
  activeModuleId?: string
  onSelectModule: (moduleId: string) => void
  toolItems?: CatalogItem[]
  onSelectTool?: (item: CatalogItem) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function ModuleSidebar({
  modules,
  modulesLoading,
  activeModuleId,
  onSelectModule,
  toolItems = [],
  onSelectTool,
  mobileOpen,
  onMobileClose,
}: Props) {
  const body = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">MODULE · MCP</p>
        {onMobileClose ? (
          <button type="button" className="text-xs text-[var(--muted)] md:hidden" onClick={onMobileClose}>
            關閉
          </button>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto" aria-label="模組導航">
        {modulesLoading ? (
          <p className="px-2 text-xs text-[var(--muted)]">載入 MODULE…</p>
        ) : modules.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--line)] px-2 py-3 text-xs text-[var(--muted)]">
            尚未啟用 MODULE。到 Studio 設定 manifest 與 MCP。
          </div>
        ) : (
          <ul className="space-y-0.5">
            {modules.map((mod) => (
              <li key={mod.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left text-sm',
                    activeModuleId === mod.id
                      ? 'bg-[var(--line)]/50 font-medium text-[var(--fg)]'
                      : 'hover:bg-[var(--line)]/40',
                  )}
                  onClick={() => onSelectModule(mod.id)}
                >
                  {mod.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {toolItems.length > 0 && onSelectTool ? (
          <div className="border-t border-[var(--line)] pt-2">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase text-[var(--muted)]">此頁 MCP 工具</p>
            <ul className="space-y-0.5">
              {toolItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-[var(--line)]/40"
                    onClick={() => onSelectTool(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>
    </>
  )

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="關閉模組選單"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={cn(
          'flex h-full w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)]/50 p-3',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-lg',
          mobileOpen ? 'max-md:flex' : 'max-md:hidden',
          'md:flex',
        )}
      >
        {body}
      </aside>
    </>
  )
}
