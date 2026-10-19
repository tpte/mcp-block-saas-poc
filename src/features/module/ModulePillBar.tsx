import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import type { CatalogItem } from '../../mcp/client'

type Props = {
  items: CatalogItem[]
  onSelect: (item: CatalogItem) => void
}

export function ModulePillBar({ items, onSelect }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    for (const item of items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return [...map.entries()]
  }, [items])

  const [active, setActive] = useState<string | null>(null)
  const activeItems = groups.find(([g]) => g === active)?.[1] ?? []

  return (
    <div className="border-b border-[var(--line)] bg-[var(--card)]/40 px-4 py-2">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="模組 pill">
        {groups.map(([group]) => (
          <button
            key={group}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              active === group ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]' : 'border-[var(--line)]',
            )}
            onClick={() => setActive((g) => (g === group ? null : group))}
          >
            {group}
          </button>
        ))}
      </div>
      {active && activeItems.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {activeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rounded-md border border-[var(--line)] px-2 py-1 text-xs hover:opacity-80"
              onClick={() => onSelect(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
