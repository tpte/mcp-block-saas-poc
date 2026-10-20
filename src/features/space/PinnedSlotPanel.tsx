import { useMemo } from 'react'
import type { CockpitSlot } from '../../../shared/cockpit.ts'
import type { PlatformConfig } from '../../mcp/client'
import { BlockCanvas } from '../canvas/BlockCanvas'
import type { BlockAction } from '../../types/ui'
import type { CockpitSlotState } from '../session/useAgentSession'
import { EMPTY_CANVAS } from '../session/applyUiResponse'

type Props = {
  side: 'left' | 'right'
  slots: CockpitSlot[]
  slotState: Record<string, CockpitSlotState>
  platform: PlatformConfig
  onAction: (action: BlockAction) => void
  onRefresh: (slot: CockpitSlot) => void
}

export function PinnedSlotPanel({ side, slots, slotState, platform, onAction, onRefresh }: Props) {
  const compactPlatform = useMemo(
    () => ({
      ...platform,
      density: 'compact' as const,
      canvasMaxWidth: 'full' as const,
      suggestionsEnabled: false,
    }),
    [platform],
  )

  if (!slots.length) return null

  return (
    <div className="flex min-h-0 flex-col gap-2 p-2">
      {slots.map((slot) => {
        const state = slotState[slot.id] ?? { loading: true, canvas: EMPTY_CANVAS }
        return (
          <section
            key={slot.id}
            data-testid={`cockpit-slot-${side}-${slot.id}`}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)]/50"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-2 py-1.5">
              <p className="truncate text-xs font-medium text-[var(--muted)]">{slot.label}</p>
              <button
                type="button"
                className="shrink-0 text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
                onClick={() => onRefresh(slot)}
                disabled={state.loading}
              >
                重新整理
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {state.error ? (
                <p className="p-2 text-xs text-amber-800 dark:text-amber-200">{state.error}</p>
              ) : (
                <BlockCanvas
                  canvas={state.canvas}
                  canvasLoading={state.loading}
                  platform={compactPlatform}
                  suggestions={[]}
                  onAction={onAction}
                  onSuggest={() => {}}
                />
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
