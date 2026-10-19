import { useEffect, useMemo, useState } from 'react'
import type { ResourceGraph, ResourceHealth, ResourceNodeKind } from '../../../shared/resourceGraph.ts'
import { fetchResourceMap } from '../../mcp/client'

const healthClass: Record<ResourceHealth, string> = {
  healthy: 'text-emerald-600',
  degraded: 'text-amber-600',
  down: 'text-red-600',
  unknown: 'text-[var(--muted)]',
}

const KIND_ORDER: ResourceNodeKind[] = [
  'Workspace',
  'Module',
  'McpServer',
  'DataSource',
  'Agent',
  'GitRepo',
  'Deployment',
  'StorageFile',
]

type Props = {
  open: boolean
  onToggle: () => void
  embedded?: boolean
  refreshKey: number
}

export function WorkspaceMapPanel({ open, onToggle, embedded = false, refreshKey }: Props) {
  const [graph, setGraph] = useState<ResourceGraph | null>(null)

  useEffect(() => {
    void fetchResourceMap()
      .then((d) => setGraph(d.graph))
      .catch(() => setGraph(null))
  }, [refreshKey])

  const nodeById = useMemo(() => {
    const map = new Map<string, ResourceGraph['nodes'][number]>()
    for (const n of graph?.nodes ?? []) map.set(n.id, n)
    return map
  }, [graph])

  const grouped = useMemo(() => {
    if (!graph) return []
    const map = new Map<ResourceNodeKind, ResourceGraph['nodes']>()
    for (const n of graph.nodes) {
      const list = map.get(n.kind) ?? []
      list.push(n)
      map.set(n.kind, list)
    }
    return KIND_ORDER.filter((k) => map.has(k)).map((kind) => [kind, map.get(kind)!] as const)
  }, [graph])

  if (!graph) return null

  if (embedded && !open) return null

  return (
    <section className={embedded ? 'max-h-[45vh] overflow-y-auto px-3 pb-3 pt-2' : 'shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2'}>
      {!embedded ? (
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--muted)]"
          onClick={onToggle}
        >
          工作區地圖（{graph.nodes.length} 資源 · {graph.edges.length} 連線）
          <span>{open ? '▾' : '▸'}</span>
        </button>
      ) : (
        <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
          工作區地圖（{graph.nodes.length} 資源 · {graph.edges.length} 連線）
        </p>
      )}
      {open ? (
        <div className="mt-2 max-h-56 space-y-3 overflow-y-auto text-xs">
          {grouped.map(([kind, nodes]) => (
            <div key={kind}>
              <p className="mb-1 font-medium text-[var(--muted)]">{kind}</p>
              <ul className="space-y-0.5">
                {nodes.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-[var(--line)]/30"
                  >
                    <span className="truncate">{n.label}</span>
                    <span className={healthClass[n.health]} title={n.health}>
                      ●
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {graph.edges.length > 0 ? (
            <div>
              <p className="mb-1 font-medium text-[var(--muted)]">連線</p>
              <ul className="space-y-0.5 font-mono text-[10px] text-[var(--muted)]">
                {graph.edges.map((e) => {
                  const from = nodeById.get(e.from)?.label ?? e.from
                  const to = nodeById.get(e.to)?.label ?? e.to
                  return (
                    <li key={e.id} className="truncate">
                      {from} —{e.kind}→ {to}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
          <p className="text-[10px] text-[var(--muted)]">更新 {graph.updatedAt.slice(11, 19)}</p>
        </div>
      ) : null}
    </section>
  )
}
