import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import type { UiBlock } from '../types/ui.ts'

type Props = {
  block: UiBlock
  expanded?: boolean
  focused?: boolean
  onFocusBlock?: () => void
  onExpand?: () => void
  children: ReactNode
}

export function BlockShell({ block, expanded, focused, onFocusBlock, onExpand, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(Boolean(block.presentation?.collapsible))

  useEffect(() => {
    if (focused) ref.current?.focus()
  }, [focused])

  const label = block.props.title || block.component.replace('Shadcn', '').replace('Block', '')

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="group"
      aria-label={label}
      data-block-id={block.blockId}
      onFocus={onFocusBlock}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.defaultPrevented) {
          event.preventDefault()
          onExpand?.()
        }
        if (event.key === ' ' && block.presentation?.collapsible) {
          event.preventDefault()
          setCollapsed((v) => !v)
        }
      }}
      className={cn(
        'rounded-xl outline-none transition-shadow',
        focused ? 'ring-2 ring-[var(--fg)]/30' : 'ring-1 ring-transparent',
        expanded ? 'ring-2 ring-emerald-500/40' : '',
      )}
    >
      {block.presentation?.collapsible ? (
        <button
          type="button"
          className="mb-1 flex w-full items-center justify-between px-1 text-left text-xs text-[var(--muted)]"
          onClick={() => setCollapsed((v) => !v)}
        >
          <span>{collapsed ? '▸' : '▾'} {label}</span>
          <span className="opacity-70">Enter 放大</span>
        </button>
      ) : null}
      {!collapsed ? children : null}
    </div>
  )
}
