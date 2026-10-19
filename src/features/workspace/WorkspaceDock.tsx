import type { Workspace } from '../../../shared/domain.ts'
import { cn } from '../../lib/utils'

type Props = {
  workspaces: Workspace[]
  activeWorkspaceId: string
  onSelect: (workspace: Workspace) => void
}

export function WorkspaceDock({ workspaces, activeWorkspaceId, onSelect }: Props) {
  return (
    <nav
      className="flex shrink-0 gap-2 overflow-x-auto border-t border-[var(--line)] bg-[var(--card)]/80 px-3 py-2 backdrop-blur-md"
      aria-label="SPACE 切換"
    >
      {workspaces.map((ws) => {
        const active = ws.id === activeWorkspaceId
        return (
          <button
            key={ws.id}
            type="button"
            title={ws.name}
            onClick={() => onSelect(ws)}
            className={cn(
              'flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl px-3 py-1.5 text-center transition',
              active
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-md'
                : 'bg-[var(--bg)] text-[var(--muted)] hover:bg-[var(--line)]/40',
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {ws.slug.slice(0, 3)}
            </span>
            <span className="max-w-[5.5rem] truncate text-xs font-medium">{ws.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
