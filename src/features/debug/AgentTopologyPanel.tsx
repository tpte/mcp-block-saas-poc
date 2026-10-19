import { useEffect, useState } from 'react'
import { fetchRunTree, type RunNode } from '../../mcp/client'

type TreeNode = RunNode & { children?: TreeNode[] }

type Props = {
  runId: string | null
}

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <li className="text-xs" style={{ marginLeft: depth * 12 }}>
      <span className={node.ok ? 'text-emerald-700' : 'text-red-600'}>
        {node.agentId} · {node.tool}
      </span>
      <span className="ml-1 text-[var(--muted)]">
        ({node.userId} · {node.mcpServer ?? '-'} · {node.durationMs}ms)
      </span>
      {node.children?.map((child) => (
        <NodeView key={child.id} node={child} depth={depth + 1} />
      ))}
    </li>
  )
}

export function AgentTopologyPanel({ runId }: Props) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!runId) {
      setTree([])
      return
    }
    void fetchRunTree(runId).then((data) => setTree(data.tree as TreeNode[]))
  }, [runId])

  if (!runId || tree.length === 0) return null

  return (
    <section className="border-t border-[var(--line)] bg-[var(--card)]/20 px-4 py-2">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--muted)]"
        onClick={() => setOpen((v) => !v)}
      >
        Agent 拓撲 ({runId.slice(0, 8)}…)
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {tree.map((node) => (
            <NodeView key={node.id} node={node} depth={0} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}
