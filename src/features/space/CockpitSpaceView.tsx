import type { ReactNode } from 'react'
import { useState } from 'react'
import type { CockpitConfig, CockpitSlot } from '../../../shared/cockpit.ts'
import type { BlockAction } from '../../types/ui'
import type { CockpitSlotState } from '../session/useAgentSession'
import { PinnedSlotPanel } from './PinnedSlotPanel'
import { useCockpitSlots } from './useCockpitSlots'

type SessionSlice = {
  runMcpInvokeToSlot: (slotId: string, tool: string, payload?: Record<string, unknown>) => Promise<void>
  clientSession: { workspaceId: string }
  cockpitSlotState: Record<string, CockpitSlotState>
}

type Props = {
  cockpit: CockpitConfig
  main: ReactNode
  session: SessionSlice
  onBlockAction: (action: BlockAction) => void
  onOpenSlotInMain?: (slot: CockpitSlot) => void
}

export function CockpitSpaceView({
  cockpit,
  main,
  session,
  onBlockAction,
  onOpenSlotInMain,
}: Props) {
  const [pinsOpen, setPinsOpen] = useState(false)
  const left = cockpit.left ?? []
  const right = cockpit.right ?? []

  useCockpitSlots([...left, ...right], session)

  const refresh = (slot: CockpitSlot) => {
    void session.runMcpInvokeToSlot(slot.id, slot.tool, slot.payload)
  }

  const pinCount = left.length + right.length

  const pinPanelProps = {
    slotState: session.cockpitSlotState,
    onAction: onBlockAction,
    onRefresh: refresh,
    onOpenInMain: onOpenSlotInMain,
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {pinCount > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--card)]/30 px-3 py-2 xl:hidden">
          <p className="text-xs text-[var(--muted)]">固定小工具在左右兩側（寬螢幕）或點下方展開</p>
          <button
            type="button"
            className="shrink-0 rounded-md border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs"
            onClick={() => setPinsOpen((o) => !o)}
          >
            {pinsOpen ? '關閉' : '固定格'}
          </button>
        </div>
      ) : null}

      <div
        className={
          pinCount > 0
            ? 'grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_240px]'
            : 'min-h-0 flex-1 overflow-hidden'
        }
      >
        {pinCount > 0 ? (
          <aside className="hidden min-h-0 min-w-0 overflow-hidden border-[var(--line)] xl:block xl:border-r">
            <PinnedSlotPanel side="left" slots={left} {...pinPanelProps} />
          </aside>
        ) : null}

        <div id="cockpit-main" className="min-h-0 min-w-0 overflow-hidden">
          {main}
        </div>

        {pinCount > 0 ? (
          <aside className="hidden min-h-0 min-w-0 overflow-hidden border-[var(--line)] xl:block xl:border-l">
            <PinnedSlotPanel side="right" slots={right} {...pinPanelProps} />
          </aside>
        ) : null}
      </div>

      {pinsOpen && pinCount > 0 ? (
        <div className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-[var(--line)] xl:hidden">
          <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
            {left.length ? <PinnedSlotPanel side="left" slots={left} {...pinPanelProps} /> : null}
            {right.length ? <PinnedSlotPanel side="right" slots={right} {...pinPanelProps} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
