import type { CockpitSlot } from '../../../shared/cockpit.ts'
import { renderBlock } from '../../blocks/registry'
import type { BlockAction, UiBlock } from '../../types/ui'
import type { CockpitSlotState } from '../session/useAgentSession'
import { EMPTY_CANVAS } from '../session/applyUiResponse'

type Props = {
  side: 'left' | 'right'
  slots: CockpitSlot[]
  slotState: Record<string, CockpitSlotState>
  onAction: (action: BlockAction) => void
  onRefresh: (slot: CockpitSlot) => void
  onOpenInMain?: (slot: CockpitSlot) => void
}

function metricsFromCanvas(blocks: UiBlock[]) {
  const grid = blocks.find((b) => b.component === 'ShadcnMetricGridBlock')
  return grid?.props.metrics ?? []
}

function PinSlotBody({
  state,
  onAction,
}: {
  state: CockpitSlotState
  onAction: (action: BlockAction) => void
}) {
  if (state.loading) {
    return <p className="px-2 py-3 text-xs text-[var(--muted)]">載入中…</p>
  }
  if (state.error) {
    return <p className="px-2 py-3 text-xs text-amber-800 dark:text-amber-200">{state.error}</p>
  }

  const metrics = metricsFromCanvas(state.canvas.blocks)
  if (metrics.length > 0) {
    return (
      <ul className="divide-y divide-[var(--line)] px-2 py-1">
        {metrics.map((m) => (
          <li key={m.label} className="py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">{m.label}</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums leading-tight">{m.value}</p>
            {m.trend ? <p className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">{m.trend}</p> : null}
          </li>
        ))}
      </ul>
    )
  }

  const first = state.canvas.blocks[0]
  if (!first) {
    return <p className="px-2 py-3 text-xs text-[var(--muted)]">尚無資料</p>
  }

  return (
    <div className="cockpit-pin-fallback max-w-full overflow-hidden p-1 text-sm [&_*]:max-w-full">
      {renderBlock(first, onAction)}
    </div>
  )
}

export function PinnedSlotPanel({
  side,
  slots,
  slotState,
  onAction,
  onRefresh,
  onOpenInMain,
}: Props) {
  if (!slots.length) return null

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      {slots.map((slot) => {
        const state = slotState[slot.id] ?? { loading: true, canvas: EMPTY_CANVAS }
        return (
          <section
            key={slot.id}
            data-testid={`cockpit-slot-${side}-${slot.id}`}
            className="flex max-h-[min(42vh,360px)] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--card)]"
          >
            <div className="flex items-center justify-between gap-1 border-b border-[var(--line)] px-2 py-1.5">
              <p className="truncate text-xs font-medium">{slot.label}</p>
              <div className="flex shrink-0 gap-1">
                {onOpenInMain ? (
                  <button
                    type="button"
                    className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
                    onClick={() => onOpenInMain(slot)}
                  >
                    主畫布
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
                  onClick={() => onRefresh(slot)}
                  disabled={state.loading}
                >
                  更新
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <PinSlotBody state={state} onAction={onAction} />
            </div>
          </section>
        )
      })}
    </div>
  )
}
