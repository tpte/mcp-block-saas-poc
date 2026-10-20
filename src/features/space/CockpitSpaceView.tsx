import type { ReactNode } from 'react'
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
  const left = cockpit.left ?? []
  const right = cockpit.right ?? []

  useCockpitSlots([...left, ...right], session)

  const refresh = (slot: CockpitSlot) => {
    void session.runMcpInvokeToSlot(slot.id, slot.tool, slot.payload)
  }

  const pinPanelProps = {
    slotState: session.cockpitSlotState,
    onAction: onBlockAction,
    onRefresh: refresh,
    onOpenInMain: onOpenSlotInMain,
  }

  const hasPins = left.length + right.length > 0

  return (
    <div
      className={
        hasPins
          ? 'grid h-full min-h-0 flex-1 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:grid-rows-1'
          : 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
      }
    >
      {left.length ? (
        <aside className="col-span-1 max-h-44 min-h-0 min-w-0 overflow-hidden border-b border-[var(--line)] lg:col-start-1 lg:row-start-1 lg:max-h-none lg:border-b-0 lg:border-r">
          <PinnedSlotPanel side="left" slots={left} {...pinPanelProps} />
        </aside>
      ) : null}
      {right.length ? (
        <aside className="col-span-1 max-h-44 min-h-0 min-w-0 overflow-hidden border-b border-l border-[var(--line)] lg:col-start-3 lg:row-start-1 lg:max-h-none lg:border-b-0 lg:border-l">
          <PinnedSlotPanel side="right" slots={right} {...pinPanelProps} />
        </aside>
      ) : null}
      <div
        id="cockpit-main"
        className="col-span-2 min-h-0 min-w-0 overflow-hidden bg-[var(--bg)] lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:border-x lg:border-[var(--line)]"
      >
        {main}
      </div>
    </div>
  )
}
