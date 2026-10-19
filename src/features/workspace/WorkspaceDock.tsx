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
      aria-label="工作區"
    >
      <span className="hidden shrink-0 self-center pr-1 text-[10px] font-medium tracking-wide text-[var(--muted)] sm:inline">
        工作區
      </span>
      {workspaces.map((ws) => {
        const active = ws.id === activeWorkspaceId
        return (
          <button
            key={ws.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(ws)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm transition',
              active
                ? 'bg-[var(--fg)] font-medium text-[var(--bg)]'
                : 'text-[var(--muted)] hover:bg-[var(--line)]/40 hover:text-[var(--fg)]',
            )}
          >
            {ws.name}
          </button>
        )
      })}
    </nav>
  )
}
