import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import type { CatalogItem } from '../../mcp/client'

type Props = {
  items: CatalogItem[]
  onSelect: (item: CatalogItem) => void
  loading?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function ModuleSidebar({ items, onSelect, loading, mobileOpen, onMobileClose }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    for (const item of items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return [...map.entries()]
  }, [items])

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(([g]) => [g, true])),
  )

  const body = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">模組</p>
        {onMobileClose ? (
          <button type="button" className="text-xs text-[var(--muted)] md:hidden" onClick={onMobileClose}>
            關閉
          </button>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto" aria-label="模組導航">
        {loading ? (
          <p className="px-2 text-xs text-[var(--muted)]">載入模組目錄…</p>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--line)] px-2 py-3 text-xs text-[var(--muted)]">
            此工作區 manifest 未啟用任何模組。請在「工作台」編輯 manifest，或請 admin 開啟 catalog。
          </div>
        ) : null}
        {groups.map(([group, list]) => (
          <div key={group}>
            <button
              type="button"
              className="mb-1 w-full text-left text-xs font-medium text-[var(--muted)]"
              onClick={() => setOpen((o) => ({ ...o, [group]: !o[group] }))}
            >
              {open[group] ? '▾' : '▸'} {group}
            </button>
            {open[group] ? (
              <ul className="space-y-0.5">
                {list.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--line)]/40',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
                      )}
                      onClick={() => onSelect(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
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
