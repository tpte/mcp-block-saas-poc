import { useState } from 'react'
import type { ToolTraceEntry } from '../../../shared/trace.ts'

type Props = {
  entries: ToolTraceEntry[]
  defaultOpen?: boolean
}

export function ToolTracePanel({ entries, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [expanded, setExpanded] = useState<number | null>(null)

  if (entries.length === 0) return null

  return (
    <section className="border-t border-[var(--line)] bg-[var(--card)]/30 px-4 py-2">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--muted)]"
        onClick={() => setOpen((v) => !v)}
      >
        Tool Trace ({entries.length})
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
          {entries.map((entry, i) => (
            <li key={`${entry.tool}-${i}-${entry.durationMs}`}>
              <button
                type="button"
                className="w-full rounded px-1 py-0.5 text-left hover:bg-[var(--line)]/30"
                onClick={() => setExpanded((e) => (e === i ? null : i))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setExpanded((e) => (e === i ? null : i))
                }}
              >
                <span className={entry.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}>
                  {entry.ok ? '✓' : '✗'} {entry.tool}
                </span>
                <span className="ml-2 text-[var(--muted)]">
                  {entry.durationMs}ms · {entry.source}
                  {entry.provider ? ` · ${entry.provider}` : ''}
                </span>
              </button>
              {expanded === i ? (
                <pre className="mt-1 overflow-x-auto rounded bg-[var(--bg)] p-2 text-[10px]">
                  {JSON.stringify(entry.payload ?? {}, null, 2)}
                  {entry.error ? `\nerror: ${entry.error}` : ''}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
