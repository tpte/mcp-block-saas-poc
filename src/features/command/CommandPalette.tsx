import { useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogItem } from '../../mcp/client'

type Props = {
  open: boolean
  items: CatalogItem[]
  onClose: () => void
  onSelect: (item: CatalogItem) => void
}

export function CommandPalette({ open, items, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q) || item.id.includes(q),
    )
  }, [items, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      queueMicrotask(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-[15vh] p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="命令盤"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋模組或 MCP tool…"
          className="w-full border-b border-[var(--line)] bg-transparent px-4 py-3 text-sm outline-none"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setIndex((i) => Math.max(i - 1, 0))
            }
            if (event.key === 'Enter' && filtered[index]) {
              event.preventDefault()
              onSelect(filtered[index])
              onClose()
            }
          }}
        />
        <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
          {filtered.map((item, i) => (
            <li key={item.id} role="option" aria-selected={i === index}>
              <button
                type="button"
                className={`flex w-full flex-col px-4 py-2 text-left text-sm ${i === index ? 'bg-[var(--line)]/50' : ''}`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <span>{item.label}</span>
                <span className="text-xs text-[var(--muted)]">{item.group}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="px-4 py-3 text-sm text-[var(--muted)]">沒有符合的項目</li> : null}
        </ul>
      </div>
    </div>
  )
}
