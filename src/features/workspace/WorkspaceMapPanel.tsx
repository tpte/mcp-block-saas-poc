import { useEffect, useState } from 'react'
import type { ResourceGraph, ResourceHealth } from '../../../shared/resourceGraph.ts'
import { fetchResourceMap } from '../../mcp/client'

const healthClass: Record<ResourceHealth, string> = {
  healthy: 'text-emerald-600',
  degraded: 'text-amber-600',
  down: 'text-red-600',
  unknown: 'text-[var(--muted)]',
}

type Props = {
  open: boolean
  onToggle: () => void
  refreshKey: number
}

export function WorkspaceMapPanel({ open, onToggle, refreshKey }: Props) {
  const [graph, setGraph] = useState<ResourceGraph | null>(null)

  useEffect(() => {
    void fetchResourceMap()
      .then((d) => setGraph(d.graph))
      .catch(() => setGraph(null))
  }, [refreshKey])

  if (!graph) return null

  return (
    <section className="border-t border-[var(--line)] bg-[var(--card)]/25 px-4 py-2">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--muted)]"
        onClick={onToggle}
      >
        工作區地圖（{graph.nodes.length} 資源）
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
          {graph.nodes.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-[var(--line)]/30">
              <span>
                <span className="text-[var(--muted)]">{n.kind}</span> · {n.label}
              </span>
              <span className={healthClass[n.health]} title={n.health}>
                ●
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {open && graph.edges.length > 0 ? (
        <p className="mt-1 text-[10px] text-[var(--muted)]">{graph.edges.length} 條連線 · 更新 {graph.updatedAt.slice(11, 19)}</p>
      ) : null}
    </section>
  )
}
