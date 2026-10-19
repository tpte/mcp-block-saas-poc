import { cn } from '../../lib/utils'

export type StudioSection = 'builder' | 'map' | 'workbench'

const TABS: { id: StudioSection; label: string }[] = [
  { id: 'builder', label: '打造後台' },
  { id: 'map', label: '工作區地圖' },
  { id: 'workbench', label: '工作台' },
]

type Props = {
  active: StudioSection
  onChange: (section: StudioSection) => void
}

export function StudioSectionTabs({ active, onChange }: Props) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--line)] px-4 py-2" role="tablist">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs',
            active === id
              ? 'border-[var(--fg)] bg-[var(--card)] font-medium text-[var(--fg)]'
              : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]',
          )}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
