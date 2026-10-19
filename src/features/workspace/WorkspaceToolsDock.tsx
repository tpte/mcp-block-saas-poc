import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type WorkspaceToolTab = 'builder' | 'map' | 'workbench' | null

type Props = {
  compact: boolean
  activeTab: WorkspaceToolTab
  onTabChange: (tab: WorkspaceToolTab) => void
  builder: ReactNode
  map: ReactNode
  workbench: ReactNode
  debug: ReactNode
}

const TABS: { id: Exclude<WorkspaceToolTab, null>; label: string }[] = [
  { id: 'builder', label: '打造後台' },
  { id: 'map', label: '地圖' },
  { id: 'workbench', label: '工作台' },
]

export function WorkspaceToolsDock({
  compact,
  activeTab,
  onTabChange,
  builder,
  map,
  workbench,
  debug,
}: Props) {
  if (!compact) {
    return (
      <div className="max-h-[min(36vh,320px)] min-h-0 shrink-0 overflow-y-auto overscroll-contain border-t border-[var(--line)] bg-[var(--bg)]">
        {builder}
        {map}
        {workbench}
        {debug}
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs',
              activeTab === id
                ? 'border-[var(--fg)] bg-[var(--card)] font-medium text-[var(--fg)]'
                : 'border-[var(--line)] text-[var(--muted)]',
            )}
            onClick={() => onTabChange(activeTab === id ? null : id)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'builder' ? builder : null}
      {activeTab === 'map' ? map : null}
      {activeTab === 'workbench' ? workbench : null}
      {debug}
    </div>
  )
}
