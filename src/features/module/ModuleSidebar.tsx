import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import type { CatalogItem } from '../../mcp/client'

type Props = {
  items: CatalogItem[]
  onSelect: (item: CatalogItem) => void
}

export function ModuleSidebar({ items, onSelect }: Props) {
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

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)]/50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">模組</p>
      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto" aria-label="模組導航">
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
    </aside>
  )
}
